import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { CONFIRM_EMAIL_URL } from 'src/commons/constants/envConstanst';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendUserConfirmation(user: User, token: string) {
        const url = `${CONFIRM_EMAIL_URL}?id=${user['_id']}&token=${token}`;

        return await this.mailerService.sendMail({
            to: user.email,
            // from: '"Support Team" <support@example.com>', // override default from
            subject: '[HFP] - CONFIRMATION EMAIL',
            template: './confirmation', // `.hbs` extension is appended automatically
            context: { //
                name: `${user.fullName}`,
                url,
                code: token,
            },
        });
    }
    async sendUserForgotPassword(user: User, token: string) {
        return await this.mailerService.sendMail({
            to: user.email,
            subject: '[HFP] - RESET YOUR PASSWORD',
            template: './forgotpasswd', // `.hbs` extension is appended automatically
            context: { //
                name: `${user.fullName}`,
                email: user.email,
                code: token,
            },
        });
    }
    
    async sendInfoStaff(user: User, password: string) {
        return await this.mailerService.sendMail({
            to: user.email,
            subject: '[HFP] - LOGIN INFORMATION',
            template: './infostaff', 
            context: { 
                name: `${user.fullName}`,
                email: user.email,
                password: password,
            },
        });
    }
}
