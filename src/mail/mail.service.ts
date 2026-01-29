import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly transporter: nodemailer.Transporter) {}

  async sendVerificationEmail(email: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"No Reply" <no-reply@test.com>`,
        to: email,
        subject: 'Verify your email',
        html: '<p>Verify email</p>',
      });
    } catch (error) {
      this.logger.error(`Email failed: ${email}`, error.message);
      throw error;
    }
  }
}
