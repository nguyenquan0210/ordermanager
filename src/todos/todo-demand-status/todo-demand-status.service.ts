import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { TODO_DEMAND_STATUS } from 'src/commons/constants/schemaConst';
import { CreateLabelDto } from 'src/labels/dto/create-label.dto';
import { UpdateLabelDto } from 'src/labels/dto/update-label.dto';
import { LabelDocument } from 'src/labels/entities/label.entity';
import { StaffRole } from '../../users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';

@Injectable()
export class TodoDemandStatusService {

    constructor(
        @InjectModel(TODO_DEMAND_STATUS) private model: Model<LabelDocument>
    ) {
    }

    async create(createLabelDto: CreateLabelDto, authUser: JwtUser) {
        CheckRoleStaff(authUser, StaffRole.Profile);
        if(createLabelDto.color){
            const checkColor = await this.checkColor(createLabelDto.color, authUser);
            if (checkColor) {
                throw new BadRequestException(ErrCode.E_COLOR);
            }
        }
        return new this.model(createLabelDto)
            .withTenant(authUser.owner)
            .save();
    }
    async checkColor(color: string, authUser: JwtUser){
        let check = await this.model.findOne({color: color}).byTenant(authUser.owner).exec();
        if (check) {
            return true; 
        }
        return false;
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
            .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_STATUS_NOT_FOUND))
            .exec();
    }

    async update(id: string, updateLabelDto: UpdateLabelDto, authUser: JwtUser) {
        CheckRoleStaff(authUser, StaffRole.Profile);
        if(updateLabelDto.color){
            const status = await this.findOne(id, authUser);
            if(status && status.color != updateLabelDto.color){
                const checkColor = await this.checkColor(updateLabelDto.color, authUser);
                if (checkColor) {
                    throw new BadRequestException(ErrCode.E_COLOR);
                }
            }
        }
        return this.model.findByIdAndUpdate(id, updateLabelDto)
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_STATUS_NOT_FOUND))
            .exec();
    }

    remove(id: string, authUser: JwtUser) {
        CheckRoleStaff(authUser, StaffRole.Profile);

        return this.model.findByIdAndDelete(id)
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_STATUS_NOT_FOUND))
            .exec();
    }
}
