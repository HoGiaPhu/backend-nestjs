import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    const tagName = createTagDto.name.trim();

    const existingTag = await this.prisma.tags.findUnique({
      where: {
        name: tagName,
      },
      select: {
        id: true,
      },
    });

    if (existingTag) {
      throw new ConflictException('tag already exist');
    }

    return this.prisma.tags.create({
      data: {
        name: tagName,
      },
    });
  }

  findAll() {
    return this.prisma.tags.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
  }

  async update(tagId: number, updateTagDto: UpdateTagDto) {
    if (!updateTagDto.name) {
      throw new BadRequestException('No data to update');
    }

    const tag = await this.prisma.tags.findUnique({
      where: {
        id: tagId,
      },
      select: {
        id: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const tagName = updateTagDto.name.trim();

    const existingTag = await this.prisma.tags.findUnique({
      where: {
        name: tagName,
      },
      select: {
        id: true,
      },
    });

    if (existingTag && existingTag.id !== tagId) {
      throw new ConflictException('Tag name already exist');
    }

    return this.prisma.tags.update({
      where: {
        id: tagId,
      },
      data: {
        name: tagName,
      },
    });
  }

  async remove(tagId: number) {
    const tag = await this.prisma.tags.findUnique({
      where: {
        id: tagId,
      },
      select: {
        id: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tags.delete({
      where: {
        id: tagId,
      },
    });

    return {
      message: 'Tag deleted',
    };
  }
}
