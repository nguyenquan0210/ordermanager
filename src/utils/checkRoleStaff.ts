import { ForbiddenException } from '@nestjs/common';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { UserRole, StaffRole } from 'src/users/interface/userRoles';

export const CheckRoleStaff = (userReq: JwtUser, staffRole: StaffRole) => {
    if(userReq.role == UserRole.Staff){
        for (let index = 0; index < userReq.staffRole?.length; index++) {
            if(userReq.staffRole && userReq.staffRole[index] == staffRole){
                return true;
            }
        }
        throw new ForbiddenException();
    }
    return true;
}