import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtConstants } from 'src/commons/constants/envConstanst';
import { UsersService } from 'src/users/users.service';
import { JwtUser } from './inteface/jwtUser';
import { LevelAccount, UserRole } from 'src/users/interface/userRoles';
import { JwtPayload } from './inteface/jwtPayload';
import { DepartmentsService } from 'src/departments/department.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private userService: UsersService,
        private departmentsService: DepartmentsService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JwtConstants.secret,
        });
    }

    async validate(payload: JwtPayload): Promise<JwtUser> {
        const userId = payload.id;
        const user = await this.userService.findOne(userId, { throwIfFail: false, lean: true });
        if (!user) {
            throw new UnauthorizedException();
        }

        let levelAccount = LevelAccount.ADVANCE;
      

        let department = await this.departmentsService.getDepartment(payload?.owner, false);

        const ret = {
            userId: payload.id,
            username: payload.user,
            role: payload.role,
            owner: payload.owner,
            staffRole: user.staffRole,
            // manager: payload.manager,
            fullName: user.fullName,
            levelAccount: levelAccount || LevelAccount.ADVANCE,
            department: department
        }
        if (ret.role == UserRole.Owner) {
            ret.owner = payload.id;
        }
        return ret;
    }
}
