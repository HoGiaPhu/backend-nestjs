import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';
import type { Request } from 'express';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { AssignRoleDto } from 'src/roles/dto/assign-role.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/roles/constants/permissions.constant';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'assign app role for user ' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/role')
  assignRole(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) userId: number,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.userService.assignRole(request.user.sub, userId, assignRoleDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update user profile' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(
    @Req() request: Request & { user: JwtPayload },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(request.user.sub, updateProfileDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user role Admin' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'admin get user detail' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.findOne(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'admin lock user account' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.USERS_LOCK)
  @Patch(':id/lock')
  lockUser(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.userService.lockUser(request.user.sub, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin unlocks a user account' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/unlock')
  unlockUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.unlockUser(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin soft deletes a user' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  softDeleteUser(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.userService.softDelete(request.user.sub, userId);
  }
}
