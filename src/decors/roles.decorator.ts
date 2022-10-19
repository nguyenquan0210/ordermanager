import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/interface/userRoles';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/commons/guards/role.guard';

export const ROLES_KEY = 'roles';

export function Roles(...roles: UserRole[]) {
    return applyDecorators(
        SetMetadata(ROLES_KEY, roles),
        UseGuards(RolesGuard),
    );
}