import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('mail.host'),
          port: configService.getOrThrow<number>('mail.port'),
          secure: configService.getOrThrow<boolean>('mail.secure'),
          auth: {
            user: configService.getOrThrow<string>('mail.user'),
            pass: configService.getOrThrow<string>('mail.password'),
          },
        },
        defaults: {
          from: configService.getOrThrow<string>('mail.from'),
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
