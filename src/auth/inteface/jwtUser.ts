import { UserRole, StaffRole, LevelAccount } from "src/users/interface/userRoles";

export interface JwtUser {
    userId: string,
    username: string,
    role: UserRole,
    owner?: string,
    staffRole?: StaffRole[], 
    // manager?: string,
    fullName?: string,
    levelAccount?: LevelAccount, 
}