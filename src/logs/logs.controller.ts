import { Controller, Get, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('logs')
export class LogsController {
  constructor(private readonly logService: LogsService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.logService.findAll();
  }
}
