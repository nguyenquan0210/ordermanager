import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConstants } from 'src/commons/constants/envConstanst';
import { DepartmentsModule } from 'src/departments/department.module';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: JwtConstants.secret,
      signOptions: {
        expiresIn: JwtConstants.accessTokenExpire
      }
    }),
    UsersModule,
    DepartmentsModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule { }
