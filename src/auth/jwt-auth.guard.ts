import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super()
    }
    override canActivate(context: ExecutionContext) {
        const allowPublic = this.reflector.get<boolean>('allow-public', context.getHandler());

        if (allowPublic) return true;

        return super.canActivate(context);
    }
}