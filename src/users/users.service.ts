import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
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
