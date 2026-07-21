import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { connect } from 'node:http2';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private async sureCategoryExist(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async sureTagsExist(tagIds: number[]) {
    const tags = await this.prisma.tags.findMany({
      where: {
        id: {
          in: tagIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new NotFoundException('Tags not found');
    }
  }

  async create(authorId: number, createPostDto: CreatePostDto) {
    if (createPostDto.categoryId !== undefined) {
      await this.sureCategoryExist(createPostDto.categoryId);
    }

    if (createPostDto.tagIds !== undefined) {
      await this.sureTagsExist(createPostDto.tagIds);
    }

    return this.prisma.post.create({
      data: {
        title: createPostDto.title.trim(),
        content: createPostDto.content.trim(),
        authorId,
        categoryId: createPostDto.categoryId,
        tags:
          createPostDto.tagIds !== undefined
            ? { connect: createPostDto.tagIds.map((id) => ({ id })) }
            : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.post.findMany({
      orderBy: {
        createAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(userId: number, postId: number, updatePostDto: UpdatePostDto) {
    if (
      !updatePostDto.title &&
      !updatePostDto.content &&
      updatePostDto.categoryId === undefined &&
      updatePostDto.tagIds === undefined
    ) {
      throw new BadRequestException('No data to update');
    }

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only update your own post');
    }

    if (updatePostDto.categoryId !== undefined) {
      await this.sureCategoryExist(updatePostDto.categoryId);
    }

    if (updatePostDto.tagIds !== undefined) {
      await this.sureTagsExist(updatePostDto.tagIds);
    }

    return this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title: updatePostDto.title?.trim(),
        content: updatePostDto.content?.trim(),
        categoryId: updatePostDto.categoryId,
        tags:
          updatePostDto.tagIds !== undefined
            ? { set: updatePostDto.tagIds.map((id) => ({ id })) }
            : undefined,
      },
    });
  }

  async remove(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own post');
    }

    await this.prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return {
      message: 'Post deleted successfully',
    };
  }
}
