import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { S3Service } from 'src/s3/s3.service';
import { ShearchPostDto } from './dto/shearch-post.dto';
import { LogsService } from 'src/logs/logs.service';
import { PostAuditAction } from 'generated/prisma/enums';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly logsService: LogsService,
  ) {}

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

  async uploadImage(userId: number, postId: number, file: Express.Multer.File) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
        imageKey: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Cant find post');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(' you only can upload image for your post');
    }

    const newImageKey = await this.s3Service.uploadPostImage(file);

    let updatedPost;

    try {
      updatedPost = await this.prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          imageKey: newImageKey,
        },
      });
    } catch (error) {
      await this.s3Service.deletePostImage(newImageKey);
      throw error;
    }

    if (post.imageKey) {
      await this.s3Service.deletePostImage(post.imageKey);
    }

    return {
      message: 'Post image upload done',
      imageKey: updatedPost.imageKey,
    };
  }

  async getImageUrl(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        imageKey: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.imageKey) {
      throw new NotFoundException('Post does not hav image');
    }

    const imageUrl = await this.s3Service.getPostImageUrl(post.imageKey);

    return {
      imageUrl,
      expiresIn: 3600,
    };
  }

  findAll(shearchPostDto: ShearchPostDto) {
    const keyword = shearchPostDto.q?.trim();
    return this.prisma.post.findMany({
      where: keyword
        ? {
            title: {
              contains: keyword,
              mode: 'insensitive',
            },
          }
        : undefined,
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

    const updatedPost = await this.prisma.post.update({
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

    await this.logsService.createPostAuditLog({
      postId: updatedPost.id,
      postTitle: updatedPost.title,
      actorId: userId,
      action: PostAuditAction.UPDATE,
    });

    return updatedPost;
  }

  async remove(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
        imageKey: true,
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

    if (post.imageKey) {
      await this.s3Service.deletePostImage(post.imageKey);
    }

    return {
      message: 'Post deleted successfully',
    };
  }
}
