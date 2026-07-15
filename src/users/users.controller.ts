import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

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

  @ApiOperation({ summary: 'Get user role Admin' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
