import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const categoryName = createCategoryDto.name.trim();

    const existingCategory = await this.prisma.category.findUnique({
      where: {
        name: categoryName,
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category already exist');
    }

    return this.prisma.category.create({
      data: {
        name: categoryName,
        description: createCategoryDto.description?.trim(),
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        createdAt: 'asc',
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

  async update(categoryId: number, updateCategoryDto: UpdateCategoryDto) {
    if (!updateCategoryDto.name && !updateCategoryDto.description) {
      throw new BadRequestException('No data to update');
    }
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

    if (updateCategoryDto.name) {
      const categoryName = updateCategoryDto.name.trim();

      const existingCategory = await this.prisma.category.findUnique({
        where: {
          name: categoryName,
        },
        select: {
          id: true,
        },
      });

      if (existingCategory && existingCategory.id !== categoryId) {
        throw new ConflictException('Category name already exist');
      }
    }

    return this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name: updateCategoryDto.name?.trim(),
        description: updateCategoryDto.description?.trim(),
      },
    });
  }

  async remove(categoryId: number) {
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

    await this.prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return {
      message: 'Category deleted',
    };
  }
}
