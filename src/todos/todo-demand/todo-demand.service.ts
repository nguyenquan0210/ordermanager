import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { TODO_DEMAND } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting, SortOrder } from 'src/commons/dto/sorting';
import { filterParams } from 'src/commons/utils/filterParams';
import { Customer } from 'src/customers/entities/customer.entity';
import { Product } from 'src/products/entities/product.entity';
import { TodoDemandDocument } from '../entities/todo-demand.entity';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDemandDto } from './dto/create-todo-demand.dto';
import { UpdateTodoDemandDto } from './dto/update-todo-demand.dto';
import { QueryTodoDemand } from './dto/query-todo-demand.dto';
import { StaffRole, UserRole } from '../../users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';

@Injectable()
export class TodoDemandService {
  /**
   *
   */
  constructor(
    @InjectModel(TODO_DEMAND) private todoDemandDoc: Model<TodoDemandDocument>
  ) { }

  create(createTodoDemandDto: CreateTodoDemandDto, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Demand);
    let todo = new this.todoDemandDoc(createTodoDemandDto)
      .withTenant(authUser.owner)
    todo.createdBy = authUser == null ? "" : authUser.userId;
    return todo.save();
  }

  async findAll(authUser: JwtUser, query?: Paginate & QueryTodoDemand & Sorting) {
    let filter: FilterQuery<TodoDemandDocument> = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.fromDate) {
      filter.createdAt = { $gte: query.fromDate };
    }

    if (query.toDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(query.toDate).setUTCHours(23, 59, 59)
      };
    }

    if (query.demandDate) {
      filter.startTime = { $lte: query.demandDate };
      filter.endTime = { $gte: query.demandDate };

      if (query.demandEndDate) {
        const endDate = new Date(query.demandEndDate);
        endDate.setHours(23, 59, 59);
        filter.startTime = { $lte: endDate };
        filter.endTime = { $gte: query.demandDate };
      }
    }

    const cond = filterParams(query, ['status', 'relate', 'target']);
    var cmd = this.todoDemandDoc.find({ ...filter, ...cond })
      .byTenant(authUser.owner)
      .populate({ path: 'customers', select: 'fullName email phone avatar', model: Customer.name })
      .populate({ path: 'products', select: 'name description imageList', model: Product.name })
      .populate({ path: 'relateTodos', select: 'name description startDate dueDate status attachments', model: Todo.name })
      .lean({ autopopulate: true })
    if (query.labels) {
      if (Array.isArray(query.labels) && query.labels.length > 0) {
        cmd.where('labels').in(query.labels);
      } else {
        cmd.where('labels', query.labels);
      }
    }
    if (query.customerId) {
      cmd.where('customers', query.customerId);
    }
    if(authUser.role == UserRole.Staff){
      cmd.where('createdBy', authUser.userId);
    }
    if (query.limit) {
      cmd.limit(query.limit);
    }
    if (query.offset) {
      cmd.skip(query.offset);
    }
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }

    const totalCmd = this.todoDemandDoc.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.todoDemandDoc.findById(id)
      .byTenant(authUser.owner)
      .populate({ path: 'customers', select: 'fullName email phone avatar', model: Customer.name })
      .populate({ path: 'products', select: 'name description imageList', model: Product.name })
      .populate({ path: 'relateTodos', select: 'name description startDate dueDate status attachments', model: Todo.name })
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();
  }

  async featuredDemands(authUser: JwtUser) {
    let filter: FilterQuery<TodoDemandDocument> = {};
    let date = new Date();
    date = new Date(date.toISOString().slice(0, 10));
    filter.endTime = { $gte: date };
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59);
    filter.startTime = { $lte: endDate };
    const cmd = this.todoDemandDoc.find({...filter});

    cmd.byTenant(authUser.owner)
      .populate({ path: 'relateTodos', select: 'name description', model: Todo.name })
      .sort({ ['createdAt']: SortOrder.desc })
      .limit(5)
      .select('name description startTime endTime status relateTodos')
      .lean({ autopopulate: true });
    if(authUser.role == UserRole.Staff && 
      authUser.staffRole?.find(item => item == StaffRole.AssignTodo) == undefined){
      cmd.where('relateStaffs', authUser.userId);
    }
    const totalCmd = this.todoDemandDoc.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);

    return { total, data }
  }

  async update(id: string, updateTodoDemandDto: UpdateTodoDemandDto, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Demand);

    const doc = await this.todoDemandDoc.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();

      if(authUser.role == UserRole.Staff && authUser.userId != doc.createdBy){
      throw new ForbiddenException();
    }
    const result = await doc.set(updateTodoDemandDto).save();
    return result;
  }

  async remove(id: string, userReq: JwtUser) {
    // CheckRoleStaff(userReq, StaffRole.Demand);
    const data = await this.todoDemandDoc.findById(id)
    .byTenant(userReq.owner)
    .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
    .exec();
    
    if(userReq.role == UserRole.Staff && userReq.userId != data.createdBy){
      throw new ForbiddenException();
    }
    const demandGroup = await this.todoDemandDoc.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();

    return demandGroup;
  }

  async addRelateTodo(id: string, todoIds: string[], authUser: JwtUser) {
    const doc = await this.todoDemandDoc.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();

    if (!doc.relateTodos) {
      doc.relateTodos = [] as any;
    }
    doc.relateTodos.addToSet(...todoIds);
    const result = await doc.save();
    return result;
  }

  async changeRelateTodo(id: string, todoIds: string[], authUser: JwtUser) {
    const doc = await this.todoDemandDoc.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();

    if (!doc.relateTodos) {
      doc.relateTodos = [] as any;
    }

    doc.relateTodos.splice(0); //remove all
    doc.relateTodos.addToSet(...todoIds);

    const result = await doc.save();

    return result;
  }

  async removeReleteTodo(id: string, todoIds: string[], authUser: JwtUser) {
    const doc = await this.todoDemandDoc.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_STATUS_NOT_FOUND))
      .exec();

    todoIds.forEach((item) => {
      var todo = doc.relateTodos?.find(f => f['_id'].equals(item));

      if (todo) {
        doc.relateTodos.pull(item)
      }
    });

    const result = await doc.save();

    return result;
  }
}
