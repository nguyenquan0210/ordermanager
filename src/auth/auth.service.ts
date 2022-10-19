import {
    BadRequestException, Injectable, NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConstants } from 'src/commons/constants/envConstanst';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { MyLogService } from 'src/loggers/winston.logger';
import { MailService } from 'src/mail/mail.service';
import { ConfirmCodeService } from 'src/users/confirmCode.service';
import { UserDocument } from 'src/users/entities/user.entity';
import { ConfirmCodeScope } from 'src/users/interface/confirmCodeScope';
import { UserRole } from 'src/users/interface/userRoles';
import { UsersService } from 'src/users/users.service';
import { UserRefreshToken } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register.dto';
import { ConfirmOtpDto } from './dto/confirm-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRefreshOtp } from './dto/refresh-otp.dto';
import { OkRespone } from 'src/commons/OkResponse';
import { QueryCheckUser } from './dto/query-check-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
        private confirmCodeService: ConfirmCodeService,
        private logger: MyLogService,
    ) { }

    async checkUserExisted(query: QueryCheckUser){
        if(query.email){
            const user = await this.userService.isUserExist(query.email);
            if (user) {
                throw new NotFoundException(ErrCode.E_USER_EMAIL_EXISTED);
            }
        }
        if(query.phone){
            const user = await this.userService.isPhoneNumberExist(query.phone);
            if (user) {
                throw new NotFoundException(ErrCode.E_USER_PHONE_EXISTED);
            }
        }
        return true
    }
    
    async login(username: string, password: string) {

        const user = await this.userService.findByUsername(username, { password: true });
        if (!user) {
            throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
        }

        if(user.role == UserRole.Owner){
            const verifyUser = await this.userService.verifyUserEmail(username);
            if (!verifyUser) {
                throw new NotFoundException(ErrCode.E_USER_NOT_VERIFY);
            }
        }
        const validPassword = await this.userService.verifyUserPassword(user, password);
        if (!validPassword) throw new UnauthorizedException(ErrCode.E_USER_PASS_NOT_MATCH);

        if (user.lock == true) throw new UnauthorizedException(ErrCode.E_USER_LOCK);

        const accessToken = this.genAccessToken(user);
        const refreshToken = this.genRefreshToken(user);
        user.lastLogin = new Date();
        await user.save();
        return { accessToken, refreshToken };
    }

    private genAccessToken(user: UserDocument) {
        const payload = {
            id: user._id,
            user: user.username,
            role: user.role,
            iss: 'hifive',
            owner: (user.owner as unknown as UserDocument)?._id,
            staffRole: user.staffRole,
            // manager: user.manager,
        };
        return this.jwtService.sign(payload);
    }

    private genRefreshToken(user: UserDocument) {
        const payload = {
            id: user._id,
            user: user.username,
            role: user.role,
            iss: 'hifive',
        };
        return this.jwtService.sign(payload, {
            secret: user.password,
            expiresIn: JwtConstants.refreshTokenExpire
        })
    }

    async refreshToken(userTokens: UserRefreshToken) {
        const payload = this.jwtService.verify(userTokens.accessToken, {
            secret: JwtConstants.secret,
            ignoreExpiration: true
        });
        const id = payload['id'];

        const user = await this.userService.findOne(id, {
            throwIfFail: true,
            password: true,
            lean: false
        });

        const key = user.password;
        const rfTokenDecode = this.jwtService.verify(userTokens.refreshToken, {
            secret: key,
            ignoreExpiration: false
        });

        const expired = rfTokenDecode['exp'];

        const nowInSec = Math.floor(Date.now() / 1000);

        let refreshToken = userTokens.refreshToken;
        // regen refresh token if it will be expired soon
        if (expired - nowInSec < JwtConstants.refresh_token_regen) {
            refreshToken = this.genRefreshToken(user);
        }

        const accessToken = this.genAccessToken(user);

        // update last login time
        user.lastLogin = new Date();
        await user.save();

        return { accessToken, refreshToken };
    }

    async register(dto: RegisterUserDto) {
        const exist = await this.userService.findByUsername(dto.email, { password: false })

        if (exist) {
            throw new BadRequestException(ErrCode.E_USER_EXISTED);
        }

        const phoneNumber = await this.userService.isPhoneNumberExist(dto.phone);
        if (phoneNumber) {
            throw new BadRequestException(ErrCode.E_USER_PHONE_EXISTED);
        }

        // const user = await this.userService.registerStaff({
        //     ...dto,
        //     role: UserRole.Staff
        // });

        // tạo tài khoản manager
        // const user = await this.userService.registerManager({
        //     ...dto,
        //     role: UserRole.Manager
        // });

        // tạo tài khoản owner
        const user = await this.userService.registerOwner({
            ...dto,
            role: UserRole.Owner
        });

        const token = Math.floor(10000 + Math.random() * 90000).toString();
        await this.confirmCodeService.create({
            userId: user._id,
            token,
            scope: ConfirmCodeScope.ConfirmEmail
        }, user.email);

        this.mailService.sendUserConfirmation(user, token)
            .then((res) => {
                this.logger.log(`[email] send confirmation to ${user.email} done: ${JSON.stringify(res)}`)
            })
            .catch((error: Error) => {
                this.logger.error(`[email] send confirmation to ${user.email} error`, error.stack);
            })
        return user;
    }

    async confirmEmail(id: string, token: string) {
        const confirmCode = await this.confirmCodeService.findOne(id, token,
            ConfirmCodeScope.ConfirmEmail);
        if (confirmCode) {
            await Promise.all([
                this.confirmCodeService.delete(confirmCode._id),
                this.userService.setUserVerified(id)
            ]);
        } else {
            throw new BadRequestException("Confirmation code expired or not found");
        }
    }

    async forgotPassword(email: string) {
        const user = await this.userService.findByUsername(email, { password: false })

        if (!user) {
            throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
        }
        const token = Math.floor(10000 + Math.random() * 90000).toString();
        await this.confirmCodeService.create({
            userId: user._id,
            token,
            scope: ConfirmCodeScope.ForgotPass
        }, user.email);

        this.mailService.sendUserForgotPassword(user, token)
            .then((res) => {
                this.logger.log(`[email] send forgot passwd to ${user.email} done: ${JSON.stringify(res)}`);
            })
            .catch(error => {
                this.logger.error(`[email] send forgot passwd to ${user.email} error`, error.stack);
            })
        return user;
    }

    async confirmOtp(info: ConfirmOtpDto) {
        const user = await this.userService.findByUsername(info.email, { password: false })
        if (!user) {
            throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
        }
        const confirmCode = await this.confirmCodeService.findOne(
            user._id,
            info.code,
            ConfirmCodeScope.ForgotPass);
        if (!confirmCode) {
            const check = await this.confirmCodeService.findOneUser(user._id, ConfirmCodeScope.ForgotPass);
            if (!check) {
                throw new BadRequestException(ErrCode.E_OTP_EXPIRED);
            }
            throw new BadRequestException(ErrCode.E_OTP_NOT_MATCH);
        }      
        return true;
    }

    async resetPassword(info: ResetPasswordDto) {
        const user = await this.userService.findByUsername(info.email, { password: false })
        if (!user) {
            throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
        }
        const confirmCode = await this.confirmCodeService.findOne(
            user._id,
            info.code,
            ConfirmCodeScope.ForgotPass);
        if (!confirmCode) {
            const check = await this.confirmCodeService.findOneUser(user._id, ConfirmCodeScope.ForgotPass);
            if (!check) {
                throw new BadRequestException(ErrCode.E_OTP_EXPIRED);
            }
            throw new BadRequestException(ErrCode.E_OTP_NOT_MATCH);
        }

        await this.userService.setPassword(user, info.password);
        const accessToken = this.genAccessToken(user);
        const refreshToken = this.genRefreshToken(user);

        user.lastLogin = new Date();

        await Promise.all([
            user.save(),
            this.confirmCodeService.delete(confirmCode._id)
        ])
        return { accessToken, refreshToken };
    }

    async getUserId(email: string){
        const user = await this.userService.findByUsername(email, { password: true });
        if (!user) {
            throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
        }
        return user._id;
    }

    async refreshOtp(userRefreshOtp: UserRefreshOtp) {
        const user = await this.userService.findByUsername(userRefreshOtp.email, { password: true });
        if (!user) {
            throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
        }

        const token = Math.floor(10000 + Math.random() * 90000).toString();
        await this.confirmCodeService.create({
            userId: user._id,
            token,
            scope: ConfirmCodeScope.ConfirmEmail
        }, user.email);

        this.mailService.sendUserConfirmation(user, token)
            .then((res) => {
                this.logger.log(`[email] send confirmation to ${user.email} done: ${JSON.stringify(res)}`)
            })
            .catch((error: Error) => {
                this.logger.error(`[email] send confirmation to ${user.email} error`, error.stack);
            })
        return new OkRespone({ data: { email: user.email } });
    }
}
