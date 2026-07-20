import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '../../../generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

export type JwtPayload = {
  sub: number;
  username: string;
  role: Role;
  permissions?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isLocked: true,
        deletedAt: true,
        appRole: {
          select: {
            permissions: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked');
    }

    return {
      sub: user.id,
      username: user.username,
      role: user.role,
      permissions: user.appRole?.permissions ?? [],
    };
  }
}
