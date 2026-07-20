import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoleController } from './roles.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RoleController],
  providers: [RolesService],
})
export class RolesModule {}
