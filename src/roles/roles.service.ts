import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const roleName = createRoleDto.name.trim().toUpperCase();

    const existingRole = await this.prisma.appRole.findUnique({
      where: {
        name: roleName,
      },
      select: {
        id: true,
      },
    });

    if (existingRole) {
      throw new ConflictException('Role aready exist');
    }

    return this.prisma.appRole.create({
      data: {
        name: roleName,
        description: createRoleDto.description?.trim(),
        permissions: [...new Set(createRoleDto.permissions)],
      },
    });
  }

  findAll() {
    return this.prisma.appRole.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  async updatePermissions(
    roleId: number,
    updateRolePermissionDto: UpdateRolePermissionDto,
  ) {
    const role = await this.prisma.appRole.findUnique({
      where: {
        id: roleId,
      },
      select: {
        id: true,
      },
    });

    if (!role) {
      throw new NotFoundException('No role found!');
    }

    return this.prisma.appRole.update({
      where: {
        id: roleId,
      },
      data: {
        permissions: [...new Set(updateRolePermissionDto.permissions)],
      },
    });
  }
}
