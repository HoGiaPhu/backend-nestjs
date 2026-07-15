import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(to: string, resetToken: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Reset your password',
      text: [
        `Your reset token: ${resetToken}`,
        'This token expires in 15 minutes.',
      ].join('\n'),
    });
  }
}
