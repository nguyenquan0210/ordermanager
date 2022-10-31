import { Body, Controller, HttpCode, Get, Post, Res, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags, ApiQuery } from '@nestjs/swagger';
import { OkRespone } from 'src/commons/OkResponse';
import { AuthService } from './auth.service';
import { UserRefreshToken } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register.dto';
import { UserLoginDto } from './dto/userLogin.dto';
import { Response } from 'express';
import { ForgotPassDto } from './dto/forgot-password.dto';
import { ConfirmOtpDto } from './dto/confirm-otp.dto';
import { UserRefreshOtp } from './dto/refresh-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Get('checkUserExisted')
    @ApiQuery({ name: 'email', required: false, type: String })
    @ApiQuery({ name: 'phone', required: false, type: String })
    checkUserExisted(
      @Query('email') email?: string,
      @Query('phone') phone?: string,
    ) {
     
      return this.authService.checkUserExisted({ email, phone });
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() req: UserLoginDto) {
        return this.authService.login(req.username, req.password);
    }

    @Post('refresh_token')
    refreshToken(@Body() req: UserRefreshToken) {
        return this.authService.refreshToken(req);
    }

    @Post('register')
    async register(@Body() info: RegisterUserDto) {
        const result = await this.authService.register(info);
        return new OkRespone({
            data: {
                _id: result._id,
                username: result.username,
                role: result.role,
            }
        });
    }

    @Get('confirm_email')
    @ApiExcludeEndpoint()
    async confirmEmail(@Res() response: Response,
        @Query('id') userId: string,
        @Query('token') token: string) {
        try {
            const result = await this.authService.confirmEmail(userId, token);
            //return response.redirect('https://play.google.com/store/apps/details?id=com.hifiveplus.hiboss');
            response.contentType('html').send('Confirmation succuss');
        } catch (error) {
            return response.contentType('html').send(error.message);
        }
    }

    // @Post('confirm_email_otp')
    // async confirmEmailOtp(@Body() info: ConfirmOtpDto) {
    //     const userId = await this.authService.getUserId(info.email);
    //     const result = await this.authService.confirmEmail(userId, info.code);
    //     return new OkRespone({ data: { email: info.email } });
    // }

    @Post('forgot_password')
    async forgotPassword(@Body() info: ForgotPassDto) {
        const result = await this.authService.forgotPassword(info.email);
        return new OkRespone({ data: { email: info.email } });
    }

    @Post('refresh_otp')
    refreshOtp(@Body() email: UserRefreshOtp) {
        return this.authService.refreshOtp(email);
    }

    @Post('confirm_otp')
    async confirmOtp(@Body() info: ConfirmOtpDto) {
        const result = await this.authService.confirmOtp(info);
        return new OkRespone({ data: { email: info.email } });
    }

    /** Reset user password of email with secret code 
     * @returns new access token and refresh token if success
    */
    @Post('reset_password')
    async resetPassword(@Body() info: ResetPasswordDto) {
        const result = await this.authService.resetPassword(info);
        return result;
    }
}
