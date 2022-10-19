import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { USER_CONFIRM_CODE } from "src/commons/constants/schemaConst";
import { ConfirmCodeDto } from "./dto/confirm-code.dto";
import { UserConfirmCodeDocument } from "./entities/user-confirm.entity";
import { ConfirmCodeScope } from "./interface/confirmCodeScope";

@Injectable()
export class ConfirmCodeService {
    constructor(
        @InjectModel(USER_CONFIRM_CODE) private model: Model<UserConfirmCodeDocument>,
    ) { }

    findOne(userId: string, token: string, scope: ConfirmCodeScope) {
        return this.model.findOne({ userId, token, scope })
            .lean()
            .exec()
    }

    findOneUser(userId: string, scope: ConfirmCodeScope) {
        return this.model.findOne({ userId, scope })
            .lean()
            .exec()
    }

    create(dto: ConfirmCodeDto, email: string) {
        let code = new this.model(dto);
        code.email = email;
        return code.save()
    }

    delete(id: string) {
        return this.model.findByIdAndDelete(id)
            .exec();
    }
}
