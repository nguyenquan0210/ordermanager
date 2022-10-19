import { LevelAccount } from "../interface/userRoles";

export class QueryUser {
    search?: string;
    roles?: string[];
    manager?: string;
    createdBy?: string;
    levelAccount?: LevelAccount
}