import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { TODO_DEMAND } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting, SortOrder } from 'src/commons/dto/sorting';
import { StatusHistory } from 'src/commons/dto/status.dto';
import { getArrayField, getIds } from 'src/commons/utils/collectionHelper';
import { difference } from 'src/commons/utils/difference';
import { filterParams } from 'src/commons/utils/filterParams';
import { getExtension } from 'src/commons/utils/getExtension';
import { deleteManyFiles, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { CustomerRelateTodoService } from 'src/customers/customer-relate/customer-relate-todo.service';
import { Customer, CustomerDocument } from 'src/customers/entities/customer.entity';
import { Product, ProductDocument } from 'src/products/entities/product.entity';
import { RelateTodoService } from 'src/products/product-todo/relate-todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodo } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo, TodoDocument } from './entities/todo.entity';
import { TodoHistoriesService } from './todo-history/todo-history.service';
import { TodoComment, TodoCommentDocument } from 'src/todos/entities/todo-comment.entity';
import { LevelAccount, StaffRole, UserRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { TodoStatusService } from 'src/todos/todo-status/todo-status.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TODO_COMMENT } from 'src/commons/constants/schemaConst';
import { UsersService } from 'src/users/users.service';
import { LEVEL_ACCOUNT, STATUS } from 'src/commons/constants/envConstanst';
@Injectable()
export class TodosService {
  constructor(
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(TODO_COMMENT) private modelTodoComment: Model<TodoCommentDocument>,
    private readonly historyService: TodoHistoriesService,
    private readonly relateProductService: RelateTodoService,
    private readonly relateCustomerService: CustomerRelateTodoService,
    private readonly todoStatusService: TodoStatusService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly notificationService: NotificationsService,
    private readonly usersService: UsersService,

  ) {
    const noti = new CronJob('0 * * * * *', () => {
      this.notifyRemind();
    });

    // run every day
    const job = new CronJob('0 0 0 * * *', () => {
      this.notifyDueDateReach();
      this.notifyTodoNotDone();
    });

    this.schedulerRegistry.addCronJob('checkDueDate', job);
    this.schedulerRegistry.addCronJob('notifyRemind', noti);
    job.start();
    noti.start();

  }

  async create(createTodoDto: CreateTodoDto, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Todo);

    const doc = new this.todoModel(createTodoDto)
      .withTenant(authUser.owner);
    doc.createdBy = authUser.userId;
    if(!createTodoDto.relateStaffs||createTodoDto.relateStaffs?.length == 0 ){
      doc.relateStaffs = authUser.userId
    }

    await this.createRelate(doc, createTodoDto);

    const today = new Date();
    today.setHours(today.getHours() - 24)
    const dueDate = new Date(createTodoDto.dueDate)
    if( dueDate.getTime() < today.getTime() ) {
      const notify = {
        title: "Todo due",
        description: doc.name,
        type: NotificationType.todo,
        author: doc.createdBy ? (doc.createdBy['_id'] ?? doc.createdBy) : undefined,
        image: '',
        isRead: false,
        relateStaff: doc.createdBy ? (doc.createdBy['_id'] ?? doc.createdBy) : undefined,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }

    if(doc.relateStaffs != authUser.userId){
      const notify = {
        title: "Todo",
        description: `${authUser.fullName} created todo ${doc.name} for you`,
        type: NotificationType.todo,
        author: doc.createdBy ? (doc.createdBy['_id'] ?? doc.createdBy) : undefined,
        image: '',
        isRead: false,
        relateStaff: doc.relateStaffs[0],
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }

    if(createTodoDto?.isNotification == true){
      const dateNoti = new Date(createTodoDto?.startDate);
      dateNoti.setMinutes(dateNoti.getMinutes() - (createTodoDto?.minutes|| 0));
      doc.dateNoti = dateNoti;
    }
    return doc.save();
  }

  async findAll(authUser: JwtUser, query?: Paginate & QueryTodo & Sorting) {
    let filter: FilterQuery<TodoDocument> = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.fromDate) {
      filter.startDate = { $lte: query.fromDate };
      filter.dueDate = { $gte: query.fromDate };
    }

    if (query.toDate) {
      const endDate = new Date(query.toDate);
      endDate.setHours(23, 59, 59);
      filter.startDate = { ...filter.startDate, $lte: endDate };
      // filter.dueDate = { ...filter.dueDate, $gte: endDate };
    }
    if(query.status == STATUS.ID){
      const status = await this.todoStatusService.getListId(authUser)
      filter.status = {$nin: status};
    }
    const cond = filterParams(query, ['priority', 'target']);

    const cmd = this.todoModel.find({ ...filter, ...cond })
      .byTenant(authUser.owner)
      .populate({
        path: 'relateProducts',
        populate: { path: 'product', select: 'name description category status labels' },
        match: { product: { $ne: null } }
      })
      .populate({
        path: 'relateCustomers',
        populate: { path: 'customer', select: 'fullName email phone avatar' },
        match: { customer: { $ne: null } }
      })
      .populate({
        path: 'comments',
      })
      .populate({ path: 'relateDemands', select: 'name description status relate startTime endTime', model: TODO_DEMAND })
      .lean({ autopopulate: true })

    if (query.assignee && query.assignee.length) {
      let assignees;
      if (typeof query.assignee == 'string') {
        assignees = [query.assignee]
      } else {
        assignees = query.assignee;
      }
      cmd.where('assignee').in(assignees);
    }
    if (query.labels) {
      if (Array.isArray(query.labels) && query.labels.length > 0) {
        cmd.where('labels').in(query.labels);
      } else {
        cmd.where('labels', query.labels);
      }
    }
    if (query.status) {
      if(query.status != STATUS.ID){
        cmd.where('status', query.status);
      }
    }
    if (query.staffId) {
      if(authUser?.levelAccount != LevelAccount.BASIC && authUser?.levelAccount != LevelAccount.ADVANCE){
        throw new ForbiddenException(ErrCode.E_NEED_HIGHER_LEVEL_ACCOUNT);
      }
      if (Array.isArray(query.staffId) && query.staffId.length > 0) {
        cmd.where('relateStaffs').in(query.staffId);
      } else {
        cmd.where('relateStaffs', query.staffId);
      }
    }

    if (query.customerId) {
      // if(authUser?.levelAccount != LevelAccount.BASIC && authUser?.levelAccount != LevelAccount.ADVANCE){
      //   throw new ForbiddenException(ErrCode.E_NEED_HIGHER_LEVEL_ACCOUNT);
      // }
      const listTodo = await this.relateCustomerService.findTodoOfCustomer(query.customerId)
      cmd.where('_id').in(listTodo);
    }

    if(authUser.role == UserRole.Staff && 
      authUser.staffRole?.find(item => item == StaffRole.AssignTodo) == undefined){
      cmd.where('relateStaffs', authUser.userId);
    }
    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }

    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }
    const totalCmd = this.todoModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);
    return { total, data }
  }

  async countTarget(authUser: JwtUser) {
    const cmd = this.todoModel.aggregate([
      {
        "$match": {
          "target": {
            "$exists": true,
            "$ne": null
          }
        }
      },
      {
        $group: {
          _id: "$target",
          total: { $sum: 1 }
        }
      }
    ]);

    const [data] = await Promise.all([cmd.exec()]);
    return { data }
  }

  async todoCurent(authUser: JwtUser) {
    let filter: FilterQuery<TodoDocument> = {};
    let date = new Date();
    date = new Date(date.toISOString().slice(0, 10));
    filter.dueDate = { $gte: date };
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59);
    filter.startDate = { $lte: endDate };

    const cmd = this.todoModel.find({...filter})
      .byTenant(authUser.owner)
      .lean({ autopopulate: false });
      
    if(authUser.role == UserRole.Staff && 
      authUser.staffRole?.find(item => item == StaffRole.AssignTodo) == undefined){
      cmd.where('relateStaffs', authUser.userId);
    }
    cmd.sort({ ['createdAt']: SortOrder.desc })
    const totalCmd = this.todoModel.countDocuments(cmd.getQuery());
    const [result, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    var data = _.groupBy(result, x => x.status);
    return { total, data }
  }

  findOne(id: string, authUser: JwtUser) {
    return this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .populate({
        path: 'relateProducts',
        populate: { path: 'product', select: 'name description category status labels' }
      })
      .populate({
        path: 'relateCustomers',
        populate: { path: 'customer', select: 'fullName email phone avatar' }
      })
      .populate({
        path: 'comments',
      })
      .populate({ path: 'relateDemands', select: 'name description status relate startTime endTime', model: TODO_DEMAND })
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();
  }

  async getNotRelateProduct(id: string, authUser: JwtUser) {
    var doc = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .populate("relateProducts")
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    var relateProducts = getArrayField(doc.relateProducts, "product");
    var cmd = this.productModel.find({ _id: { $nin: relateProducts } });

    const totalCmd = this.productModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  async getNotRelateCustomer(id: string, authUser: JwtUser) {
    var doc = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .populate("relateCustomers")
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    var relateCustomers = getArrayField(doc.relateCustomers, "customer");
    var cmd = this.customerModel.find({ _id: { $nin: relateCustomers } });
    const totalCmd = this.customerModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  async update(id: string, updateTodoDto: UpdateTodoDto, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Todo);
    const doc = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();
   
    if(authUser.role == UserRole.Staff){
      const check = doc.relateStaffs.find((item)=>{
        return item?._id == authUser.userId
      })
      if(!check){
        throw new ForbiddenException();
      }
    }

    // const history = {
    //   todo: doc._id,
    //   before: doc.toJSON(),
    //   updatedBy: authUser.userId,
    //   status: StatusHistory.update
    // };

    if(updateTodoDto.isDone == true && doc.isDone != updateTodoDto.isDone){
      const result = await doc.set(updateTodoDto);
      await this.updateRalate(doc, updateTodoDto);
      // const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
      // this.historyService.create({ ...history, change }, authUser);
      this.notifyDone(doc, authUser);
      return result.save();
    }
    if(updateTodoDto.isDone == false && doc.isDone != updateTodoDto.isDone){
      const result = await doc.set(updateTodoDto);
      await this.updateRalate(doc, updateTodoDto);
      // const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
      // this.historyService.create({ ...history, change }, authUser);
      this.notifyCancel(doc, authUser);
      return result.save();
    }

    if(updateTodoDto.relateStaffs?.length > 0){
      if(updateTodoDto.relateStaffs[0] != doc.relateStaffs[0]?._id){
        const notify = {
          title: "Todo",
          description: `${authUser.fullName} created todo ${doc.name} for you`,
          type: NotificationType.todo,
          author: authUser.userId,
          image: '',
          isRead: false,
          relateStaff: updateTodoDto.relateStaffs[0],
          object: {
            id: doc.id,
            name: doc.name,
            discription: doc.description,
          },
          owner: doc.owner
        }
        this.notificationService.create( { ...notify }, authUser)
      }
    }

    if(updateTodoDto.relateStaffs === null || updateTodoDto.relateStaffs?.length == 0 ){
      updateTodoDto.relateStaffs = [authUser.userId]
    }

    if(doc.relateStaffs?.length > 0 && doc.relateStaffs[0]._id != authUser.userId){
      const notify = {
        title: "Update Todo",
        description: `${authUser.fullName} update todo ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.relateStaffs[0]._id,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }

    if(updateTodoDto?.isNotification == true){
      let dateNoti = new Date();
      if(updateTodoDto?.startDate){
        dateNoti = new Date(updateTodoDto?.startDate);
      }else{
        dateNoti = new Date(doc?.startDate);
      }
      if(updateTodoDto?.minutes){
        dateNoti.setMinutes(dateNoti.getMinutes() - (updateTodoDto?.minutes|| 0));
      }else{
        dateNoti.setMinutes(dateNoti.getMinutes() - (doc?.minutes|| 0));
      }
      doc.dateNoti = dateNoti;
    }else{
      if(updateTodoDto.minutes){
        doc.dateNoti.setMinutes(doc.dateNoti.getMinutes()- updateTodoDto.minutes)
      }
    }
    const result = await doc.set(updateTodoDto);
    await this.updateRalate(doc, updateTodoDto);

    // const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    // this.historyService.create({ ...history, change }, authUser);

    if(doc.createdBy._id != authUser.userId){
      const notify = {
        title: "Update Todo",
        description: `${authUser.fullName} update todo ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.createdBy._id,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }

    return result.save();
  }

  notifyDone(doc: any,authUser: JwtUser){
    if(doc.createdBy._id != authUser.userId){
      const notify = {
        title: "Todo done",
        description: `${authUser.fullName} finished todo ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.createdBy._id,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }

    if(doc.relateStaffs[0]?._id != authUser.userId){
      const notify = {
        title: "Todo done",
        description: `${authUser.fullName} finished todo ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.relateStaffs[0]?._id,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }
  }

  notifyCancel(doc: any,authUser: JwtUser){
    if(doc.createdBy._id != authUser.userId){
      const notify = {
        title: "Todo cancel",
        description: `${authUser.fullName} cancels todo completion ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.createdBy._id,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }

    if(doc.relateStaffs[0]?._id != authUser.userId){
      const notify = {
        title: "Todo cancel",
        description: `${authUser.fullName} cancels todo completion ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.relateStaffs[0]?._id,
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }
  }

  async remove(id: string, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Todo);
    const todo = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();
    if(authUser.role == UserRole.Staff && todo.createdBy._id != authUser.userId){
        throw new ForbiddenException();
    }

    const doc = await this.todoModel.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .populate("relateProducts")
      .populate("relateCustomers")
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    // const history = {
    //   todo: doc._id,
    //   before: doc.toJSON(),
    //   updatedBy: authUser.userId,
    //   status: StatusHistory.delete
    // };

    // NOTE: delete attachments    
    // if (doc.attachments.length > 0) {
    //   const keys = [];
    //   for (let i = 0; i < doc.attachments.length; i++) {
    //     const attachment = doc.attachments[i];
    //     keys.push(attachment.url);
    //   }

    //   if(keys.length > 0){
    //     const data = await deleteManyFiles(keys);
    //     this.usersService.updateSizeFileOwner(authUser, (-data.size));
    //   }
    // }

    await this.deleteRalate(doc);

    // const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    // this.historyService.create({ ...history, change }, authUser);


    if(doc.relateStaffs != authUser.userId){
      const notify = {
        title: "Delete Todo",
        description: `${authUser.fullName} deletes todo ${doc.name}`,
        type: NotificationType.todo,
        author: authUser.userId,
        image: '',
        isRead: false,
        relateStaff: doc.relateStaffs[0],
        object: {
          id: doc.id,
          name: doc.name,
          discription: doc.description,
        },
        owner: doc.owner
      }
      this.notificationService.create( { ...notify }, authUser)
    }
    //delete comment-reply
    await this.modelTodoComment.deleteMany({ idTodo: id}).exec();
    return doc;
  }

  // async addAttachment(todoId: string, file: Express.Multer.File, authUser: JwtUser, filename?: string) {
  //   const sizeFile = await this.usersService.getSizeFileOwner(authUser);
  //   if(sizeFile > LEVEL_ACCOUNT[authUser.levelAccount|| LevelAccount.FREE].SIZE_FILE){
  //     throw new BadRequestException(ErrCode.E_OUT_OF_MEMORY);
  //   } 
  //   const doc = await this.todoModel.findById(todoId)
  //     .byTenant(authUser.owner)
  //     .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
  //     .exec();

  //   const history = {
  //     todo: doc._id,
  //     before: doc.toJSON(),
  //     updatedBy: authUser.userId,
  //     status: StatusHistory.create
  //   };

  //   const ext = getExtension(file.originalname);
  //   const random = nanoid(24) + `${ext ? `.${ext}` : ''}`;

  //   const url = `todos/${authUser.owner ?? 'default'}/${doc._id}/attachment/${random}`;

  //   // move file to proper path
  //   await uploadFile({
  //     file: file,
  //     filePath: url,
  //     mimetype: file.mimetype
  //   })
  //   this.usersService.updateSizeFileOwner(authUser, file.size);

  //   doc.attachments.push({
  //     name: filename || file.originalname,
  //     url: url,
  //     mimetype: file.mimetype,
  //     size: file.size
  //   });

  //   const result = await doc.save();
  //   const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);

  //   this.historyService.create({ ...history, change }, authUser);

  //   return result;
  // }

  // async changeAttachment(todoId: string, fileId: string, authUser: JwtUser, filename?: string) {
  //   const doc = await this.todoModel.findById(todoId)
  //     .byTenant(authUser.owner)
  //     .select('attachments')
  //     .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
  //     .exec();

  //   const attach = doc.attachments.find(f => f['_id'].equals(fileId));
  //   if (!attach) {
  //     throw new BadRequestException(ErrCode.E_TODO_FILE_NOT_FOUND);
  //   }
  //   attach.name = filename;
  //   doc.attachments.pull(attach);
  //   doc.attachments.addToSet(attach);

  //   const result = await doc.save();

  //   return result;
  // }

  // getSignedUrl(owner: string, todoId: string, filename: string) {
  //   const key = `todos/${owner}/${todoId}/attachment/${filename}`;
  //   return signedUrl(key);
  // }

  // async removeAttachment(todoId: string, fileId: string, authUser: JwtUser) {
  //   const doc = await this.todoModel.findById(todoId)
  //     .byTenant(authUser.owner)
  //     .select('attachments')
  //     .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
  //     .exec();

  //   const history = {
  //     todo: doc._id,
  //     before: doc.toJSON(),
  //     updatedBy: authUser.userId,
  //     status: StatusHistory.update
  //   };

  //   const attach = doc.attachments.find(f => f['_id'].equals(fileId));
  //   if (!attach) {
  //     throw new BadRequestException(ErrCode.E_TODO_FILE_NOT_FOUND);
  //   }

  //   attach.deleteFile();
  //   this.usersService.updateSizeFileOwner(authUser, (-attach.size));
  //   doc.attachments.pull(attach);

  //   const result = await doc.save();
  //   const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
  //   this.historyService.create({ ...history, change }, authUser);

  //   return result;
  // }

  //#region Relate product in todo
  async addRelateProducts(todoId: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(todoId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      todo: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateProductService.addRelateProduct(doc._id, productIds);
    const change = _.omit(difference(productIds.toString(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateProducts(todoId: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(todoId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    const history = {
      todo: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.removeRelate
    };

    const result = await this.relateProductService.removeRelateProductMultiple(doc._id, productIds);
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  //#endregion
  async addRelateCustomers(todoId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(todoId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      todo: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateCustomerService.addTodoRelateCustomer(doc._id, customerIds);
    const change = _.omit(difference(customerIds.toString(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateCustomer(todoId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(todoId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    const history = {
      todo: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.update
    };

    const result = await this.relateCustomerService.removeTodoRelateCustomerMultiple(doc._id, customerIds);
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async addRelateDemands(id: string, demandIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();

    if (demandIds) {
      for (let index = 0; index < demandIds.length; index++) {
        doc.relateDemands.addToSet(demandIds[index]);
      }
    }
    const result = await doc.save();
    return result;
  }

  async changeRelateDemands(id: string, demandIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_NOT_FOUND))
      .exec();

    while (doc.relateDemands.length) {
      doc.relateDemands.pop();
    }

    if (demandIds) {
      for await (const item of demandIds) {
        doc.relateDemands.push(item);
      }
    }

    const result = await doc.save();
    return result;
  }

  async removeReleteDemands(id: string, demandIds: string[], authUser: JwtUser) {
    const doc = await this.todoModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_DEMAND_STATUS_NOT_FOUND))
      .exec();

    demandIds.forEach((item) => {
      var todo = doc.relateDemands.find(f => f['_id'].equals(item));

      if (todo) {
        doc.relateDemands.pull(item)
      }
    });

    const result = await doc.save();

    return result;
  }

  //#region private
  private async createRelate(doc: TodoDocument, obj: CreateTodoDto) {
    if (doc._id) {
      await this.relateProductService.addRelateProduct(doc, obj.relateProducts);
      await this.relateCustomerService.addTodoRelateCustomer(doc, obj.relateCustomers);
    }
  }

  private async updateRalate(doc: TodoDocument, obj: UpdateTodoDto) {
    await this.relateProductService.updateRelateProduct(doc, obj.relateProducts);
    await this.relateCustomerService.updateRelateCustomer(doc, obj.relateCustomers);
  }

  private async deleteRalate(doc: TodoDocument) {
    await this.relateProductService.delete(getIds(doc.relateProducts));
    await this.relateCustomerService.delete(getIds(doc.relateCustomers));
  }
  //#endregion


  async findAllTodoDate(userReq: JwtUser, query?: Paginate & QueryTodo & Sorting) {
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDate greater than fromDate");
    }
    // if(!query.fromDate){
    //   query.fromDate = new Date()
    // }
    let filter: FilterQuery<TodoDocument> = {};
    let dayEnd = new Date()

    // if (query.fromDate) {
    //   query.fromDate = new Date(query.fromDate)
    //   let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
    //   dayEnd = new Date(query.fromDate);
    //   dayEnd.setHours(23, 59, 59);
    //   filter.dueDate = { $gte: dayStart, $lte: dayEnd };
    // }
    // if (query.toDate) {
    //   dayEnd = new Date(query.toDate);
    //   dayEnd.setHours(23, 59, 59);
    //   filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    // }

    if (query.fromDate) {
      filter.startDate = { $lte: query.fromDate };
      filter.dueDate = { $gte: query.fromDate };
    }
    if (query.toDate) {
      const endDate = new Date(query.toDate);
      endDate.setHours(23, 59, 59);
      filter.startDate = { ...filter.startDate, $lte: endDate };
    }

    const cmd = this.todoModel.find({ ...filter })
      .byTenant(userReq.owner)
      .lean({ autopopulate: true })

    if(userReq.role == UserRole.Staff){
      // if(userReq.staffRole?.find(item => item == StaffRole.Account) == undefined){
        cmd.where('relateStaffs', userReq.userId);
      // }
    }

    const totalCmd = this.todoModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let st = [];
    let totalS = 0;
    const dataStatus = await this.todoStatusService.findAll(userReq)
    for (let i = 0; i < dataStatus.data.length; i++){
      let totalStatus = 0
      for(let j = 0; j < data.length; j++){
        if(dataStatus.data[i]?._id.toString().indexOf(data[j].status?._id) != -1 ){
          totalStatus += 1
        }
      }
      st = [...st, {
        id: dataStatus.data[i]._id,
        name: dataStatus.data[i].name,
        color: dataStatus.data[i].color||"",
        totalStatus
      }]
      totalS += totalStatus;
    }

    let totalTodoIsDone = 0
    for(let index = 0; index < data.length; index++){
      if(data[index].isDone == true ){
        totalTodoIsDone += 1
      }
    }
    if((total-totalS) > 0){
      st = [...st, {
        id: STATUS.ID,
        name: STATUS.NAME,
        color:  STATUS.COLOR,
        totalStatus: (total-totalS)
      }]
    }
  
    return { 
        total, 
        totalTodoIsDone, 
        status : st
      };
  }

  async findAllTodoStaff(userReq: JwtUser, query?: Paginate & QueryTodo & Sorting) {
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDate greater than fromDate");
    }

    // if(!query.fromDate){
    //   query.fromDate = new Date()
    // }
    let filter: FilterQuery<TodoDocument> = {};
    // let dayEnd = new Date()
    // if (query.fromDate) {
    //   query.fromDate = new Date(query.fromDate)
    //   let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
    //   dayEnd = new Date(query.fromDate);
    //   dayEnd.setHours(23, 59, 59);
    //   filter.dueDate = { $gte: dayStart, $lte: dayEnd };
    // }
    // if (query.toDate) {
    //   dayEnd = new Date(query.toDate);
    //   dayEnd.setHours(23, 59, 59);
    //   filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    // }
    if (query.fromDate) {
      filter.startDate = { $lte: query.fromDate };
      filter.dueDate = { $gte: query.fromDate };
    }
    if (query.toDate) {
      const endDate = new Date(query.toDate);
      endDate.setHours(23, 59, 59);
      filter.startDate = { ...filter.startDate, $lte: endDate };
    }
    const cmd = this.todoModel.find({ ...filter })
      .byTenant(userReq.owner)
      .lean({ autopopulate: true })
      .where('relateStaffs', query.staffId);

    const totalCmd = this.todoModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let st = [];
    let totalS = 0;
    const dataStatus = await this.todoStatusService.findAll(userReq)
    for (let i = 0; i < dataStatus.data.length; i++){
      let totalStatus = 0
      for(let j = 0; j < data.length; j++){
        if(dataStatus.data[i]?._id.toString().indexOf(data[j].status?._id) != -1 ){
          totalStatus += 1
        }
      }
      st = [...st, {
        id: dataStatus.data[i]._id,
        name: dataStatus.data[i].name,
        color: dataStatus.data[i].color||"",
        totalStatus
      }]
      totalS+= totalStatus;
    }

    let totalTodoIsDone = 0
    for(let index = 0; index < data.length; index++){
      if(data[index].isDone == true ){
        totalTodoIsDone += 1
      }
    }
    if((total-totalS) > 0){
      st = [...st, {
        id: STATUS.ID,
        name: STATUS.NAME,
        color:  STATUS.COLOR,
        totalStatus: (total-totalS)
      }]
    }
    return { 
        total, 
        totalTodoIsDone, 
        status : st
      };
  }

  //#region Schedule
  // notify user when a todo is will reach in 24h but status is not done
  private async notifyDueDateReach() {
    const begin = new Date();
    const end = new Date();
    end.setHours(end.getHours() + 24);

    begin.setHours(23, 59, 59);
    end.setHours(23, 59, 59);

    const todos = await this.todoModel.find({
      isDone: false,
      dueDate: { $gt: begin, $lte: end },
    })
      .lean()
      .exec();

    todos.forEach(todo => {
      const notify = {
        title: "Todo due date next day",
        description: `Todo ${todo.name} has 24 hours left to complete`,
        type: NotificationType.todo,
        author: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        image: '',
        isRead: false,
        relateStaff: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        object: {
          id: todo._id.toString(),
          name: todo.name,
          discription: todo.description,
        },
        owner: todo.owner
      };
      this.notificationService.create({ ...notify }, {
        userId: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        username: '',
        role: UserRole.Staff,
        owner: todo.createdBy ? (todo.createdBy['owner'] ?? undefined) : undefined,
      });

      if(todo.createdBy != todo.relateStaffs[0]){
        notify.relateStaff = todo.relateStaffs[0];
        this.notificationService.create({ ...notify }, {
          userId: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
          username: '',
          role: UserRole.Staff,
          owner: todo.createdBy ? (todo.createdBy['owner'] ?? undefined) : undefined,
        });
      }
    });

  }
  //#endregion

  // notify user when a todo not done
  private async notifyTodoNotDone() {
    const begin = new Date();
    const end = new Date();
    begin.setHours(begin.getHours() - 48);
    end.setHours(end.getHours() - 24);
    begin.setHours(23, 59, 59);
    end.setHours(23, 59, 59);

    const todos = await this.todoModel.find({
      isDone: false,
      dueDate: { $gte: begin, $lte: end },
    })
      .lean()
      .exec();

    todos.forEach(todo => {
      const notify = {
        title: "Todo due",
        description: `Todo ${todo.name} was late`,
        type: NotificationType.todo,
        author: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        image: '',
        isRead: false,
        relateStaff: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        object: {
          id: todo._id.toString(),
          name: todo.name,
          discription: todo.description,
        },
        owner: todo.owner
      };
      this.notificationService.create({ ...notify }, {
        userId: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        username: '',
        role: UserRole.Staff,
        owner: todo.createdBy ? (todo.createdBy['owner'] ?? undefined) : undefined,
      });

      if(todo.createdBy != todo.relateStaffs[0]){
        notify.relateStaff = todo.relateStaffs[0];
        this.notificationService.create({ ...notify }, {
          userId: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
          username: '',
          role: UserRole.Staff,
          owner: todo.createdBy ? (todo.createdBy['owner'] ?? undefined) : undefined,
        });
      }
    });

  }
  //#endregion

  private async notifyRemind() {
    const date = new Date();

    const todos = await this.todoModel.find({$expr: {
        $and: [
          {
            "$eq": [{"$year": "$dateNoti"}, date.getFullYear()]
          },
          {
            "$eq": [{"$month": "$dateNoti"}, (date.getMonth()+1)]
          },
          {
            "$eq": [{"$dayOfMonth": "$dateNoti"}, date.getDate()]
          },
          {
            "$eq": [{"$hour": "$dateNoti"}, date.getHours()]
          },
          {
            "$eq": [{"$minute": "$dateNoti"}, date.getMinutes()]
          }
        ]
      }})
      .where('isNotification', true)
      .lean()
      .exec();

    todos.forEach(todo => {
      const notify = {
        title: "Todo remind",
        description: `Todo remind`,
        type: NotificationType.todo,
        author: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        image: '',
        isRead: false,
        relateStaff: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        object: {
          id: todo._id.toString(),
          name: todo.name,
          discription: todo.description,
        },
        owner: todo.owner
      };
      this.notificationService.create({ ...notify }, {
        userId: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
        username: '',
        role: UserRole.Staff,
        owner: todo.createdBy ? (todo.createdBy['owner'] ?? undefined) : undefined,
      });

      if(todo.createdBy != todo.relateStaffs[0]){
        notify.relateStaff = todo.relateStaffs[0];
        this.notificationService.create({ ...notify }, {
          userId: todo.createdBy ? (todo.createdBy['_id'] ?? todo.createdBy) : undefined,
          username: '',
          role: UserRole.Staff,
          owner: todo.createdBy ? (todo.createdBy['owner'] ?? undefined) : undefined,
        });
      }
    });
  }
}
