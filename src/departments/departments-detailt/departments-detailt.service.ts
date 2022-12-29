import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEPARTMENT_DETAILT } from 'src/commons/constants/schemaConst';
import { DepartmentDetailtsDoc } from '../entities/department-detailt.entity';
import { CreateDepartmentDetailtDto } from './dto/departments-detailt.dto';

@Injectable()
export class DepartmentDetailtService {
    constructor(
        @InjectModel(DEPARTMENT_DETAILT) private model: Model<DepartmentDetailtsDoc>,
    ) { }

    async create(dto: CreateDepartmentDetailtDto) {
        return await new this.model(dto)
            .save()
    }

    async delete(ids: string[]) {
        return await this.model.deleteMany({ _id: { $in: ids } })
            .exec();
    }

    remove(productId: string, customerId: string) {
        return this.model.findOneAndDelete({ product: productId, customer: customerId })
            .exec();
    }
   
}
