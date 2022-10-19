import { IsEnum, IsMongoId, IsArray, IsBoolean } from "class-validator";
import { UserRole, StaffRole, LevelAccount } from "../interface/userRoles";

export class ChangeRoleDto {
    @IsMongoId()
    userId: string;
    @IsEnum(UserRole)
    role: UserRole;
}

export class ChangeStaffRoleDto {
    @IsMongoId()
    userId: string;
    @IsArray()
    staffRole: StaffRole[];
}

export class ChangeLockDto {
    @IsMongoId()
    userId: string;
    @IsBoolean()
    lock: boolean;
}

export class ChangeLevelAccountDto {
    @IsMongoId()
    userId: string;

    @IsEnum(LevelAccount)
    levelAccount: LevelAccount;
}