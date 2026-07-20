import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { LogsService } from 'src/logs/logs.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Role } from 'generated/prisma/enums';
import { JwtPayload } from './strategies/jwt.strategy';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logsService: LogsService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async getToken(userId: number, username: string, role: Role) {
    const payload = {
      sub: userId,
      username,
      role,
    };

    const refreshPayload = {
      ...payload,
      jti: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>(
          'jwt.refreshExpiresIn',
        ) as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash,
      },
    });
  }

  async refreshToken(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('invalod or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('invalod or expired refresh token');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenvalid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenvalid) {
      throw new UnauthorizedException('invalod or expired refresh token');
    }

    const tokens = await this.getToken(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private hashPasswordResetToken(resetToken: string) {
    return createHash('sha256').update(resetToken).digest('hex');
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user && !user.deletedAt) {
      const resetToken = randomBytes(32).toString('hex');
      const passwordResetTokenHash = this.hashPasswordResetToken(resetToken);
      const passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetTokenHash,
          passwordResetExpiresAt,
        },
      });

      await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    }
    return {
      message: 'If email exits, the passworl reset will be send for u',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordResetTokenHash = this.hashPasswordResetToken(
      resetPasswordDto.token,
    );

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash,
        deletedAt: null,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedNewPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedNewPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        refreshTokenHash: null,
      },
    });

    return {
      message: 'Password reset successfully. Please login again.',
    };
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: registerDto.username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists!');
    }

    const defaultUserRole = await this.prisma.appRole.findUnique({
      where: {
        name: 'USER',
      },
      select: {
        id: true,
      },
    });

    if (!defaultUserRole) {
      throw new InternalServerErrorException('Cant not configyre user role');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email,
        password: hashedPassword,
        name: registerDto.name,
        appRoleId: defaultUserRole.id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        appRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    return {
      message: 'Register successfully',
      user,
    };
  }

  async login(loginDto: LoginDto, request: Request) {
    const email = loginDto.email.trim().toLowerCase();
    const ip = request.ip ?? request.socket.remoteAddress;
    const userAgentHeader = request.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader.join(', ')
      : userAgentHeader;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      await this.logsService.createLoginLog({
        email,
        success: false,
        ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.deletedAt) {
      await this.logsService.createLoginLog({
        userId: user.id,
        username: user.username,
        email: user.email,
        success: false,
        ip,
        userAgent,
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.logsService.createLoginLog({
        userId: user.id,
        username: user.username,
        email: user.email,
        success: false,
        ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isLocked) {
      await this.logsService.createLoginLog({
        userId: user.id,
        username: user.username,
        email: user.email,
        success: false,
        ip,
        userAgent,
      });

      throw new ForbiddenException('Account locked');
    }

    await this.logsService.createLoginLog({
      userId: user.id,
      username: user.username,
      email: user.email,
      success: true,
      ip,
      userAgent,
    });

    const { accessToken, refreshToken } = await this.getToken(
      user.id,
      user.username,
      user.role,
    );

    await this.updateRefreshToken(user.id, refreshToken);

    return {
      message: 'Login successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: null,
      },
    });

    return {
      message: 'Logout successfull :D',
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect ');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedNewPassword,
        refreshTokenHash: null,
      },
    });

    return {
      message: 'Password changed successfull. Login again :D',
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
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
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
