import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { TODO_HISTORY } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting } from 'src/commons/dto/sorting';
import { filterParams } from 'src/commons/utils/filterParams';
import { TodoHistoryDocument } from '../entities/todo-history.entity';
import { CreateTodoHistoryDto } from './dto/create-todo-history.dto';
import { QueryTodoHistoryDto } from './dto/query-todo-history.dto';

@Injectable()
export class TodoHistoriesService {
  constructor(
    @InjectModel(TODO_HISTORY) private model: Model<TodoHistoryDocument>
  ) { }

  async getAll(authUser: JwtUser, query: Paginate & QueryTodoHistoryDto & Sorting) {
    const cond = filterParams(query, ['todo', 'updatedBy']);

    const cmd = this.model.find(cond)
      .byTenant(authUser.owner)
      .lean({ autopopulate: false })
      .populate({
        path: 'todo',        
        populate: { path: 'todo', select: 'name description status priority startDate dueDate target' }
      })
      .populate({
        path: 'updatedBy',        
        populate: { path: 'user', select: 'username fullName birth phone avatar' }
      })
      .select('-before -after -change')

    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }

    const totalCmd = this.model.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  /** get detail of an update */
  getId(id: string, authUser: JwtUser) {
    return this.model.findById(id)
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .exec();
  }

  create(dto: CreateTodoHistoryDto, authUser: JwtUser) {
    return new this.model(dto)
      .withTenant(authUser.owner)
      .save();
  }

  delete(id: string) {
    return this.model.deleteMany({ todo: id}).exec();
  }
}
