import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignRoleDto } from 'src/roles/dto/assign-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async assignRole(
    adminId: number,
    userId: number,
    assignRoleDto: AssignRoleDto,
  ) {
    if (adminId === userId) {
      throw new BadRequestException('admin cant change their role');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const appRole = await this.prisma.appRole.findUnique({
      where: {
        id: assignRoleDto.roleId,
      },
      select: {
        id: true,
      },
    });

    if (!appRole) {
      throw new NotFoundException('app role not found');
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        appRoleId: appRole.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        appRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        address: true,
        cccd: true,
        gender: true,
        phoneNumber: true,
        role: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }
    return user;
  }

  async lockUser(adminId: number, userId: number) {
    if (adminId === userId) {
      throw new BadRequestException('Admin cant lock account admin!');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        isLocked: true,
      },
    });

    if (!user) {
      throw new NotFoundException('That user not found');
    }

    if (user.isLocked) {
      return {
        message: 'user is already locked',
      };
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isLocked: true,
        refreshTokenHash: null,
      },
    });

    return {
      message: 'User Locked!',
    };
  }

  async unlockUser(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        isLocked: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (!user.isLocked) {
      return {
        message: 'user not locked',
      };
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isLocked: false,
      },
    });

    return {
      message: 'User unlocked!',
    };
  }

  async softDelete(adminId: number, userId: number) {
    if (adminId === userId) {
      throw new BadRequestException('admin cannot delete admin account');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        deletedAt: new Date(),
        isLocked: true,
        refreshTokenHash: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return {
      message: 'user deleted',
    };
  }

  async updateProfile(userId: number, updateProfile: UpdateProfileDto) {
    if (updateProfile.cccd) {
      const cccdOwner = await this.prisma.user.findUnique({
        where: {
          cccd: updateProfile.cccd,
        },
        select: {
          id: true,
        },
      });

      if (cccdOwner && cccdOwner.id !== userId) {
        throw new ConflictException('Can cuoc cong dan already used :(');
      }
    }

    if (updateProfile.phoneNumber) {
      const phoneNumberOwner = await this.prisma.user.findUnique({
        where: {
          phoneNumber: updateProfile.phoneNumber,
        },
        select: {
          id: true,
        },
      });

      if (phoneNumberOwner && phoneNumberOwner.id !== userId) {
        throw new ConflictException('Phone number alreay in use');
      }
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: updateProfile.name?.trim(),
        address: updateProfile.address?.trim(),
        cccd: updateProfile.cccd,
        gender: updateProfile.gender,
        phoneNumber: updateProfile.phoneNumber,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        address: true,
        cccd: true,
        gender: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
