import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { TODO_LABEL } from 'src/commons/constants/schemaConst';
import { CreateLabelDto } from 'src/labels/dto/create-label.dto';
import { UpdateLabelDto } from 'src/labels/dto/update-label.dto';
import { LabelDocument } from 'src/labels/entities/label.entity';
import { UserRole, StaffRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';

@Injectable()
export class TodoLabelService {

    constructor(
        @InjectModel(TODO_LABEL) private model: Model<LabelDocument>
    ) {
    }

    create(createLabelDto: CreateLabelDto, authUser: JwtUser) {
        CheckRoleStaff(authUser, StaffRole.Profile)

        return new this.model(createLabelDto)
            .withTenant(authUser.owner)
            .save();
    }

    async findAll(authUser: JwtUser) {
        const data = await this.model.find()
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
            .exec();
        return { total: data.length, data }
    }

    findOne(id: string, authUser: JwtUser) {
        return this.model.findById(id)
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
            .orFail(new NotFoundException(ErrCode.E_LABEL_NOT_FOUND))
            .exec();
    }

    update(id: string, updateLabelDto: UpdateLabelDto, authUser: JwtUser) {
        CheckRoleStaff(authUser, StaffRole.Profile)

        return this.model.findByIdAndUpdate(id, updateLabelDto)
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_LABEL_NOT_FOUND))
            .exec();
    }

    remove(id: string, authUser: JwtUser) {
        CheckRoleStaff(authUser, StaffRole.Profile);

        return this.model.findByIdAndDelete(id)
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_LABEL_NOT_FOUND))
            .exec();
    }
}
