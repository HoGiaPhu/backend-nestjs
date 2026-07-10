import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}
  createLoginLog(data: Prisma.LoginLogUncheckedCreateInput) {
    return this.prisma.loginLog.create({
      data,
    });
  }
}
