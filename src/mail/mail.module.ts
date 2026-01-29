import { Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

@Module({
  providers: [
    {
      provide: 'MAIL_TRANSPORTER',
      useFactory: () =>
        nodemailer.createTransport({
          host: 'smtp.fake.com',
          port: 587,
        }),
    },
    {
      provide: MailService,
      useFactory: (transporter) => new MailService(transporter),
      inject: ['MAIL_TRANSPORTER'],
    },
  ],
  exports: [MailService],
})
export class MailModule {}
