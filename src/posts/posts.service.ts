import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  create(authorId: number, createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: createPostDto.title.trim(),
        content: createPostDto.content.trim(),
        authorId,
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
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(userId: number, postId: number, updatePostDto: UpdatePostDto) {
    if (!updatePostDto.title && !updatePostDto.content) {
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

    return this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title: updatePostDto.title?.trim(),
        content: updatePostDto.content?.trim(),
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
