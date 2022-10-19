import { UserRole, StaffRole } from "src/users/interface/userRoles";

export interface JwtPayload {
  id: string,
  user: string,
  role: UserRole,
  iss: string,
  owner?: string,
  staffRole?: StaffRole[], 
  // manager?: string,
}