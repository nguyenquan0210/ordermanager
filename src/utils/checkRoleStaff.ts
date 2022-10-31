import { ForbiddenException } from '@nestjs/common';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserRole, StaffRole } from 'src/users/interface/userRoles';

export const CheckRoleStaff = (userReq: JwtUser, staffRole: StaffRole) => {
    if(userReq.role == UserRole.Staff){
        for (let index = 0; index < userReq.staffRole?.length; index++) {
            if(userReq.staffRole && (userReq.staffRole[index] == staffRole || userReq.staffRole[index] == StaffRole.Manager)){
                return true;
            }
        }
        throw new ForbiddenException();
    }
    if(userReq.role == UserRole.Customer){
        throw new ForbiddenException();
    }
    return true;
}
export const CheckRoleStaffCreateUser = (user: CreateUserDto, staffRole: StaffRole) => {
    if(user.role == UserRole.Staff){
        for (let index = 0; index < user.staffRole?.length; index++) {
            if(user.staffRole && (user.staffRole[index] == staffRole || user.staffRole[index] == StaffRole.Manager)){
                return true;
            }
        }
        throw new ForbiddenException();
    }
    return true;
}