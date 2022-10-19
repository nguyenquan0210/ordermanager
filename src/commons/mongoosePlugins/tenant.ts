import { User } from "src/users/entities/user.entity";

export interface ITenant {
    owner?: string | User
}