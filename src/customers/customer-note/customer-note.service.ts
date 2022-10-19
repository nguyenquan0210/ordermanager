import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { CUSTOMER_NOTE } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { SortOrder } from 'src/commons/dto/sorting';
import { filterParams } from 'src/commons/utils/filterParams';
import { CustomerNote, CustomerNoteDocument } from '../entities/customer-note.entity';
import { CreateCustomerNoteDto } from './dto/create-customer-note.dto';
import { QueryCustomerNote } from './dto/query-customer-note.dto';
import { UpdateCustomerNoteDto } from './dto/update-customer-note.dto';

@Injectable()
export class CustomerNoteService {
    constructor(
        @InjectModel(CUSTOMER_NOTE) private model: Model<CustomerNote>
    ) { }

    create(dto: CreateCustomerNoteDto, authUser: JwtUser) {
        const doc = new this.model(dto)
        doc.createdBy = authUser.userId;
        return doc.save();
    }
    async findAll(authUser: JwtUser, query?: Paginate & QueryCustomerNote) {
        const filter: FilterQuery<CustomerNoteDocument> = filterParams(query, ['customer']);
        if (query.toDate) {
            filter.createdAt = { $gte: query.toDate };
        }
        if (query.fromDate) {
            filter.createdAt = { ...filter.createdAt, $lte: query.fromDate };
        }

        const cmd = this.model.find(filter)
            .sort({ createdAt: SortOrder.desc })

        if (query.limit) {
            cmd.limit(query.limit);
        }
        if (query.offset) {
            cmd.skip(query.offset);
        }

        cmd.lean();

        const totalCmd = this.model.countDocuments(cmd.getQuery());
        const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);
        return { total, data };
    }

    findOne(id: string) {
        return this.model.findById(id)
            .lean()
            .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOTE_NOT_FOUND))
            .exec();
    }

    remove(id: string, authUser: JwtUser) {
        return this.model.findByIdAndDelete(id)
            .where('createdBy', authUser.userId)
            .exec();
    }

    update(id: string, dto: UpdateCustomerNoteDto, authUser: JwtUser) {
        return this.model.findByIdAndUpdate(id, dto)
            .where('createdBy', authUser.userId)
            .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOTE_NOT_FOUND))
            .exec();
    }
}
