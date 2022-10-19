import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { SMTP_CONFIG } from 'src/commons/constants/envConstanst';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: SMTP_CONFIG.HOST,
        secure: SMTP_CONFIG.SECURE,
        auth: {
          user: SMTP_CONFIG.USER,
          pass: SMTP_CONFIG.PASS
        },
        port: parseInt(SMTP_CONFIG.PORT) || 587,
      },
      defaults: {
        from: `"No reply" <${SMTP_CONFIG.FROM}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
