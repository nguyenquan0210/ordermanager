import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import _, { map } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting, SortOrder } from 'src/commons/dto/sorting';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { Product, ProductDocument } from 'src/products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrder } from './dto/query-order.dto';
import { Order, OrderDocument } from './entities/order.entity';
import { LevelAccount, StaffRole, UserRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { StatusHistory } from 'src/commons/dto/status.dto';
import { difference } from 'src/commons/utils/difference';
import { HistoriesService } from './histories/histories.service';
import { Types } from 'mongoose';
import { OrderStatusService } from '../order-status/order-status.service';
import { OrderLabelService } from './order-label/order-label.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { OrderStatusEnum, ORDER_STATUS_ARR, ORDER_STATUS_ENUM, StyleDiscount } from "./interface/order-discount";
import { filterParams } from 'src/commons/utils/filterParams';
import { OrderProductService } from './order-product/order-product.service';
import { ORDER_COMMENT, USER_KPI } from 'src/commons/constants/schemaConst';
import { OrderCommentDocument } from './entities/order-comment.entity';
import { Todo, TodoDocument } from 'src/todos/entities/todo.entity';
import { LABEL, STATUS } from 'src/commons/constants/envConstanst';
import { UserKPIDocument } from 'src/users/entities/user-kpi.entity';
import { Customer, CustomerDocument } from 'src/customers/entities/customer.entity';
import { UpdateDoneOrderDto } from './dto/update-done-order.dto';
import { UpdateCancelOrderDto } from './dto/update-cancel-order.dto';
import { RequestConfirmationOrderDto } from './dto/request-confirmation-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(ORDER_COMMENT) private modelOrderComment: Model<OrderCommentDocument>,
    @InjectModel(USER_KPI) private modelUserKPI: Model<UserKPIDocument>,
    private readonly historyService: HistoriesService,
    private readonly orderStatusService: OrderStatusService,
    private readonly orderLabelService: OrderLabelService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly notificationService: NotificationsService,
    private readonly orderProductService: OrderProductService,
    
  ) {
    // run every day
    const job = new CronJob('0 0 0 * * *', () => {
      this.notifyOrderNotDone();
    });

    this.schedulerRegistry.addCronJob('checkDueDateOrder', job);
    job.start();
  }

  async create(CreateOrderDto: CreateOrderDto, userReq: JwtUser) {
    // CheckRoleStaff(userReq, StaffRole.Order)

    const today = new Date();
    today.setHours(today.getHours() - 24)
    const dueDate = new Date(CreateOrderDto.dueDate)
    if( dueDate.getTime() < today.getTime() ) {
      throw new BadRequestException(ErrCode.E_ORDER_DUE_DATE);
    }

    const orderCode = new Date().getTime().toString().slice(0, 10)
    const checkOrderCode = await this.isOrderCodeExist(orderCode, userReq);
    if (checkOrderCode) {
      throw new BadRequestException(ErrCode.E_ORDER_CODE_EXISTED);
    }

    if(CreateOrderDto.products?.length > 0){
      const order = await new this.orderModel(CreateOrderDto)
      .withTenant(userReq.owner);
      order.createdBy = userReq.userId;
      let totalProductMoney = 0;
      for (let index = 0; index < CreateOrderDto.products?.length; index++) {
        if( CreateOrderDto.products[index].quantity <= 0){
          throw new BadRequestException("quantity must be greater than 0");
        }
        const validObjectId = Types.ObjectId.isValid(CreateOrderDto.products[index].product);
        if (!validObjectId) {
            throw new BadRequestException('product must be a mongodb id');
        }
        const orderProduct = await this.productModel.findById(CreateOrderDto.products[index].product)
          .byTenant(userReq.owner)
          .populateTenant('name')
          .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
          .exec();

        if(CreateOrderDto.products[index].quantity > orderProduct.quantity){
          throw new BadRequestException('product is not enough');
        }
      }

      for (let index = 0; index < CreateOrderDto.products?.length; index++) {
        const orderProduct = await this.productModel.findById(CreateOrderDto.products[index].product)
          .byTenant(userReq.owner)
          .populateTenant('name')
          .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
          .exec();

        const oProduct = {
          ...CreateOrderDto.products[index],
          order : order._id,
          nameProduct : orderProduct.name,
          imgProduct : orderProduct.imageList[0]?.url ? orderProduct.imageList[0].url : "",
          price : orderProduct.price,
          priceSale : orderProduct.priceSale,
          unit: orderProduct.unit||""
        }
        this.orderProductService.create(oProduct, userReq);

        if(orderProduct.priceSale > 0){
          const Money = orderProduct.priceSale * CreateOrderDto.products[index].quantity;
          totalProductMoney = totalProductMoney + Money;
        } else {
          const Money = orderProduct.price * CreateOrderDto.products[index].quantity;
          totalProductMoney = totalProductMoney + Money;
        }
        orderProduct.set({quantity: (orderProduct.quantity - CreateOrderDto.products[index].quantity)}).save()
      }
      order.totalProductMoney = totalProductMoney;

      // total surcharge money
      let totalSurchargeMoney = 0;
      if(CreateOrderDto.surcharge?.length > 0){
        CreateOrderDto.surcharge.forEach((item)=>{
          totalSurchargeMoney += item.priceSurcharge
        })
      }
      order.totalSurchargeMoney = totalSurchargeMoney;

      // total discount money
      let totalDiscountMoney = 0;
      if(CreateOrderDto.discount?.length > 0){
        CreateOrderDto.discount.forEach((item)=>{
          if(item.styleDiscount == StyleDiscount.money){
            totalDiscountMoney += item.moneyDiscount
          }
          if(item.styleDiscount == StyleDiscount.percent){
            const money = item.moneyDiscount / 100 * totalProductMoney
            totalDiscountMoney += money
          }
        })
      }
      order.totalDiscountMoney = totalDiscountMoney;

      order.orderCode = orderCode;
      order.totalMoney = totalSurchargeMoney + totalProductMoney - totalDiscountMoney ;
      return order.save();
    } else {
      throw new BadRequestException("Products cannot be empty");
    }
  }

  async isOrderCodeExist(orderCode: string, userReq: JwtUser) {
    let order = await this.orderModel.findOne({ orderCode: orderCode }).byTenant(userReq.owner).exec();
    if (order) {
      return true;
    }
    return false;
  }

  async findAllOrderDate(userReq: JwtUser, query?: Paginate & QueryOrder & Sorting) {
    
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDateStart greater than toDateEnd");
    }
    // if(!query.fromDate){
    //   query.fromDate = new Date()
    // }
    let filter: FilterQuery<OrderDocument> = {};
    let dayEnd = new Date()
    if (query.fromDate) {
      query.fromDate = new Date(query.fromDate)
      let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
      dayEnd = new Date(query.fromDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { $gte: dayStart, $lte: dayEnd };
    }
    if (query.toDate) {
      dayEnd = new Date(query.toDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    }
  
    const cmd = this.orderModel.find({ ...filter })
      .byTenant(userReq.owner)  
      .lean({ autopopulate: true })

    if(userReq.role == UserRole.Staff ){
      let checkStaffRole = false ;
      for (let index = 0; index < userReq.staffRole?.length; index++) {
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
          checkStaffRole = true;
        }
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Account){
          checkStaffRole = true;
        }
      }
      if(checkStaffRole != true){
        cmd.where('createdBy', userReq.userId);
      }
    }
    const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let st = [];
    let totalS = 0;
    const dataStatus =  ORDER_STATUS_ARR//await this.orderStatusService.findAll(userReq)
    for (let i = 0; i < dataStatus?.length; i++) {
      let totalStatus = 0
      for(let j = 0; j < data?.length; j++) {
        if(dataStatus[i].name.toString().indexOf(data[j].status?.toString()) != -1 ) {
          totalStatus += 1
        }
      }
      st = [...st, {
        name: dataStatus[i].name,
        color: dataStatus[i].color||"",
        totalStatus
      }]
      totalS += totalStatus;
    }
    // const OrderStatusE= OrderStatusEnum.le
    // console.log(dataStatus)

    let totalMoney = 0
    let totalOrderIsDone = 0
    let totalMoneyOrderIsDone = 0
    for(let index = 0; index < data?.length; index++){
      if(data[index].isDone == true ){
        totalOrderIsDone += 1
        totalMoneyOrderIsDone += data[index].totalMoney||0
      }
      totalMoney += data[index].totalMoney||0
    }
    if((total - totalS) > 0){
      st = [...st, {
        id: STATUS.ID,
        name: STATUS.NAME,
        color: STATUS.COLOR,
        totalStatus : (total - totalS) 
      }]
    }
    return { total, totalMoney, totalOrderIsDone, totalMoneyOrderIsDone , status: st };
  }
  async findAllOrderCustomer(userReq: JwtUser, query?: Paginate & QueryOrder & Sorting) {
    
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDateStart greater than toDateEnd");
    }
    // if(!query.fromDate){
    //   query.fromDate = new Date()
    // }
    let filter: FilterQuery<OrderDocument> = {};
    let dayEnd = new Date()
    if (query.fromDate) {
      query.fromDate = new Date(query.fromDate)
      let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
      dayEnd = new Date(query.fromDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { $gte: dayStart, $lte: dayEnd };
    }
    if (query.toDate) {
      dayEnd = new Date(query.toDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    }
  
    const cmd = this.orderModel.find({ ...filter })
      .byTenant(userReq.owner)  
      .lean({ autopopulate: true })
      .where('customers', query.customers);
    if(userReq.role == UserRole.Staff ){
      let checkStaffRole = false ;
      for (let index = 0; index < userReq.staffRole?.length; index++) {
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
          checkStaffRole = true;
        }
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Account){
          checkStaffRole = true;
        }
      }
      if(checkStaffRole != true){
        cmd.where('createdBy', userReq.userId);
      }
    }
    const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let totalMoney = 0
    let totalOrderIsDone = 0
    let totalMoneyOrderIsDone = 0
    for(let index = 0; index < data?.length; index++){
      if(data[index].isDone == true ){
        totalOrderIsDone += 1
        totalMoneyOrderIsDone += data[index].totalMoney||0
      }
      totalMoney += data[index].totalMoney||0
    }
    return { total, totalMoney, totalOrderIsDone, totalMoneyOrderIsDone, data };
  }

  async findAllOrderProduct(userReq: JwtUser, query?: Paginate & QueryOrder & Sorting) {
    
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDateStart greater than toDateEnd");
    }
    // if(!query.fromDate){
    //   query.fromDate = new Date()
    // }
    let filter: FilterQuery<OrderDocument> = {};
    let dayEnd = new Date()
    if (query.fromDate) {
      query.fromDate = new Date(query.fromDate)
      let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
      dayEnd = new Date(query.fromDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { $gte: dayStart, $lte: dayEnd };
    }
    if (query.toDate) {
      dayEnd = new Date(query.toDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    }

    const cmd = this.orderModel.find({ ...filter, products: {$elemMatch: {product: query.product }} })
      .byTenant(userReq.owner)  
      .lean({ autopopulate: true })
      
    if(userReq.role == UserRole.Staff ){
      let checkStaffRole = false ;
      for (let index = 0; index < userReq.staffRole?.length; index++) {
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
          checkStaffRole = true;
        }
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Account){
          checkStaffRole = true;
        }
      }
      if(checkStaffRole != true){
        cmd.where('createdBy', userReq.userId);
      }
    }
    const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let st = []
    let totalOrderIsDone = 0
    for(let index = 0; index < data?.length; index++){
      if(data[index].isDone == true ){
        totalOrderIsDone += 1
      }
      st = [...st, {
        order: data[index]._id,
        orderCode: data[index].orderCode || '',
        customers: data[index].customers || '',
        startDate: data[index].startDate || '',
        dueDate: data[index].startDate || ''
      }]
    }
    return { total, totalOrderIsDone , orders : st };
  }

  async findAllOrderStaff(userReq: JwtUser, query?: Paginate & QueryOrder & Sorting) {
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDateStart greater than toDateEnd");
    }
    // if(!query.fromDate){
    //   query.fromDate = new Date()
    // }
    let filter: FilterQuery<OrderDocument> = {};
    let dayEnd = new Date()
    if (query.fromDate) {
      query.fromDate = new Date(query.fromDate)
      let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
      dayEnd = new Date(query.fromDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { $gte: dayStart, $lte: dayEnd };
    }
    if (query.toDate) {
      dayEnd = new Date(query.toDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    }
  
    const cmd = this.orderModel.find({ ...filter })
      .byTenant(userReq.owner)
      .lean({ autopopulate: true })
      .where('createdBy', query.staffId);
    
    const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let st = [];
    let totalS = 0;
    const dataStatus = await this.orderStatusService.findAll(userReq)
    // for (let i = 0; i < dataStatus.data?.length; i++) {
    //   let totalStatus = 0
    //   for(let j = 0; j < data?.length; j++) {
    //     if(dataStatus.data[i]._id.toString().indexOf(data[j].status?._id) != -1 ) {
    //       totalStatus += 1
    //     }
    //   }
    //   st = [...st, {
    //     id: dataStatus.data[i]._id,
    //     name: dataStatus.data[i].name,
    //     color: dataStatus.data[i].color||"",
    //     totalStatus
    //   }]
    //   totalS+= totalStatus;
    // }

    let totalMoney = 0
    let totalOrderIsDone = 0
    let totalMoneyOrderIsDone = 0
    for(let index = 0; index < data?.length; index++){
      if(data[index].isDone == true ){
        totalOrderIsDone += 1
        totalMoneyOrderIsDone += data[index].totalMoney||0
      }
      totalMoney += data[index].totalMoney||0
    }
    if((total - totalS) > 0){
      st = [...st, {
        id: STATUS.ID,
        name: STATUS.NAME,
        color: STATUS.COLOR,
        totalStatus : (total - totalS) 
      }]
    }
    return { total, totalMoney, totalOrderIsDone, totalMoneyOrderIsDone , status: st };
  }

  async findAll(userReq: JwtUser, query?: Paginate & QueryOrder & Sorting) {
    let filter: FilterQuery<OrderDocument> = {};
    if (query.search) {
        filter.$or = [
          { $text: { $search: `.*${query.search}.*`, $language: "en" } },
          { orderCode: { $regex: `^${query.search}` } },
          { orderCode: { $regex: `${query.search}$` } },
        ]
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

    if (query.fromTotalMoney) {
      filter.totalMoney = { $gte: query.fromTotalMoney };
    }
    if (query.toTotalMoney) {
      filter.totalMoney = { $lte: query.toTotalMoney };
    }
    if (query.toTotalMoney && query.fromTotalMoney) {
      filter.totalMoney = { $gte: query.fromTotalMoney, $lte: query.toTotalMoney };
    }
    if(query.states == STATUS.ID){
      const status = await this.orderStatusService.getListId(userReq)
      filter.status = {$nin: status};
    }
    if(query.labels == LABEL.ID){
      const labels = await this.orderLabelService.getListId(userReq)
      filter.labels = {$nin: labels};
    }
    // const cond = filterParams(query, ['customers']);

    const cmd = this.orderModel.find({ ...filter })
      .byTenant(userReq.owner)
      .populate({
        path: 'comments',
      })
      .populate({
        path: 'products',
      })
      .lean({ autopopulate: true })

    if (query.isOwner) {
      cmd.where('owner', userReq.owner);
    }

    if (query.staffId) {
      if(userReq.role == UserRole.Staff){
        throw new ForbiddenException();
      }
      cmd.where('createdBy', query.staffId);
    }

    if (query.customers) {
      if(userReq?.levelAccount != LevelAccount.START_UP 
        && userReq?.levelAccount != LevelAccount.BASIC
        && userReq?.levelAccount != LevelAccount.ADVANCE){
        throw new ForbiddenException(ErrCode.E_NEED_HIGHER_LEVEL_ACCOUNT);
      }
      cmd.where('customers', query.customers);
    }
    
    if(userReq.role == UserRole.Staff){
      let checkStaffRole = false ;
      for (let index = 0; index < userReq.staffRole?.length; index++) {
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
          checkStaffRole = true;
        }
      }
      if(checkStaffRole != true){
        if(userReq.staffRole?.find(item => item == StaffRole.AssignTodo) == undefined){
          cmd.where('createdBy', userReq.userId);
        }
      }
    }
    if (query.states) {
      if(query.states != STATUS.ID){
        cmd.where('status', query.states);
      }
    }
    if (query.labels) {
      if(query.labels != LABEL.ID){
        cmd.where('labels', query.labels);
      }
    }
    if(query.requestConfirmation){
      if(query.requestConfirmation == 'false'){
        cmd.where('requestConfirmation').in([query.requestConfirmation, null]);
      }else{
        cmd.where('requestConfirmation', query.requestConfirmation);
      }
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

    const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);
    
    return { total, data };
  }

  async findOrderProduct(idProduct: string, userReq: JwtUser){
    const listOrder = await this.orderProductService.findAllOrderProduct(idProduct, userReq)
    let data = []
    if(listOrder && listOrder.length > 0){
      for (let index = 0; index < listOrder.length; index++) {
        const order = await this.orderModel.findById(listOrder[index])
        .byTenant(userReq.owner)
        .populate({
          path: 'comments',
        })
        .populate({
          path: 'products',
        })
        .lean({ autopopulate: true })
        .exec();
        data = [...data, order]
      }
    }
    const total = data?.length || 0;
    return { total, data };
  }

  async findOne(id: string, userReq: JwtUser) {
    const doc = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      .populateTenant('username')
      .populate({
        path: 'comments',
      })
      .populate({
        path: 'products',
      })
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();
    const todo = await this.todoModel.find({orders: id});
    doc.todos = [...todo];
    return doc;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userReq: JwtUser) {
    // CheckRoleStaff(userReq, StaffRole.Order)
    const doc = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      .populate({
        path: 'products',
      })
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();

    if(doc.isDone == true || doc.isCancel == true){
      const size = Object.keys(updateOrderDto).length;
      if(size != 1 || !updateOrderDto.status){
        throw new ForbiddenException();
      }
    }

    if(userReq.role == UserRole.Staff && userReq.userId != doc.createdBy._id){
      throw new ForbiddenException();
    }

    updateOrderDto.totalMoney = doc.totalMoney;
    if(updateOrderDto.products?.length > 0){
      let totalProductMoney = 0;
      for (let index = 0; index < updateOrderDto.products?.length; index++) {
        if( updateOrderDto.products[index].quantity <= 0){
          throw new BadRequestException("quantity must be greater than 0");
        }
        const validObjectId = Types.ObjectId.isValid(updateOrderDto.products[index].product);
        if (!validObjectId) {
          throw new BadRequestException('product must be a mongodb id');
        }
        const product = await this.productModel.findById(updateOrderDto.products[index].product)
          .byTenant(userReq.owner)
          .populateTenant('name')
          .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
          .lean({ autopopulate: true })
          .exec();

        const orderProduct = await this.orderProductService.findOne(updateOrderDto.products[index].product, id);
        if(orderProduct){
          if(updateOrderDto.products[index].quantity > (product.quantity + orderProduct.quantity) ){
            throw new BadRequestException('product is not enough');
          }
        }else{
          if(updateOrderDto.products[index].quantity > product.quantity ){
            throw new BadRequestException('product is not enough');
          }
        }
      }
      for (let index = 0; index < doc.products?.length; index++) {
        if(updateOrderDto.products.find(item => item.product == doc.products[index].product) == undefined){
          const product = await this.productModel.findById(doc.products[index].product)
          .byTenant(userReq.owner)
          .populateTenant('name')
          .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
          .exec();
          product.set({quantity: (product.quantity + doc.products[index].quantity)}).save();
          this.orderProductService.remove(id, doc.products[index].product);
        }
      }
      for (let index = 0; index < updateOrderDto.products?.length; index++) {
        const product = await this.productModel.findById(updateOrderDto.products[index].product)
          .byTenant(userReq.owner)
          .populateTenant('name')
          .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
          .exec();

        const orderProduct = await this.orderProductService.findOne(updateOrderDto.products[index].product, id);
        if(orderProduct){
          product.set({quantity: (product.quantity + orderProduct.quantity - updateOrderDto.products[index].quantity)}).save();
          this.orderProductService.remove(id, updateOrderDto.products[index].product);
        }else{
          product.set({quantity: (product.quantity - updateOrderDto.products[index].quantity)}).save();
        }

        const oProduct = {
          product: updateOrderDto.products[index].product,
          quantity: updateOrderDto.products[index].quantity,
          order : id,
          nameProduct : product.name,
          imgProduct : product.imageList[0]?.url ? product.imageList[0].url : "",
          price : product.price,
          priceSale : product.priceSale
        }
        this.orderProductService.update(oProduct, userReq);
        if(product.priceSale > 0){
          const Money = product.priceSale * updateOrderDto.products[index].quantity
          totalProductMoney = totalProductMoney + Money
        } else {
          const Money = product.price * updateOrderDto.products[index].quantity
          totalProductMoney = totalProductMoney + Money
        }
      }
      updateOrderDto.totalProductMoney = totalProductMoney;
      updateOrderDto.totalMoney = updateOrderDto.totalMoney - (doc.totalProductMoney||updateOrderDto.totalMoney) + totalProductMoney ;
    }
    // total surcharge money
    if(updateOrderDto.surcharge?.length > 0){
      let totalSurchargeMoney = 0;
      updateOrderDto.surcharge.forEach((item)=>{
        totalSurchargeMoney += item.priceSurcharge
      })
      updateOrderDto.totalSurchargeMoney = totalSurchargeMoney;
      updateOrderDto.totalMoney = updateOrderDto.totalMoney - doc.totalSurchargeMoney + totalSurchargeMoney ;
    }
    if(updateOrderDto.surcharge?.length == 0){
      updateOrderDto.totalSurchargeMoney = 0;
      updateOrderDto.totalMoney = updateOrderDto.totalMoney - doc.totalSurchargeMoney;
    }

    // total discount money
    if(updateOrderDto.discount?.length > 0){
      let totalDiscountMoney = 0;
      updateOrderDto.discount.forEach((item)=>{
        if(item.styleDiscount == StyleDiscount.money){
          totalDiscountMoney += item.moneyDiscount
        }
        if(item.styleDiscount == StyleDiscount.percent){
          const money = item.moneyDiscount / 100 * (updateOrderDto.totalProductMoney||doc.totalProductMoney);
          totalDiscountMoney += money
        }
      })
      updateOrderDto.totalDiscountMoney = totalDiscountMoney;
      updateOrderDto.totalMoney = updateOrderDto.totalMoney + doc.totalDiscountMoney - totalDiscountMoney ;
    }
    if(updateOrderDto.discount?.length == 0){
      updateOrderDto.totalDiscountMoney = 0;
      updateOrderDto.totalMoney = updateOrderDto.totalMoney + doc.totalDiscountMoney;
    }

    const history = {
      order: doc._id,
      before: doc.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.update
    }
    const result = await doc.set(updateOrderDto).save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({
      ...history,
      change,
    }, userReq);
    
    return result;
  }

  async updateDone(id: string, updateDoneOrderDto: UpdateDoneOrderDto, userReq: JwtUser) {
    CheckRoleStaff(userReq, StaffRole.Accountant);
    const doc = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();

    if(doc.isDone == true || doc.isCancel == true){
      throw new ForbiddenException();
    }

    const day = new Date();
    if(doc.dueDate < day){
      doc.dueDate = day;
    }
   
    const history = {
      order: doc._id,
      before: doc.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.update
    }

    if(updateDoneOrderDto.isDone == true ){
      const result = await doc.set({isDone: true}).save();
      await this.orderProductService.updateIsDone(id, userReq);

      const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
      this.historyService.create({
        ...history,
        change,
      }, userReq);

      const notify = {
        title: "Payment orders",
        description: `The order ${doc.name||""} with order number ${doc.orderCode} has been payment`,
        type: NotificationType.order,
        author: userReq ? userReq.userId : undefined,
        image: '',
        isRead: false,
        relateStaff: doc.createdBy ? (doc.createdBy['_id'] ?? doc.createdBy) : undefined,
        object: {
          id: doc._id.toString(),
          name: doc.name||"",
          orderCode: doc.orderCode,
          discription: doc.description,
        },
        owner: userReq.owner
      };
      this.notificationService.create({ ...notify }, userReq);

      return result;
    }

    const result = await doc.set(updateDoneOrderDto).save();

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({
      ...history,
      change,
    }, userReq);
    
    return result;
  }

  async updateCancel(id: string, updateCancelOrderDto: UpdateCancelOrderDto, userReq: JwtUser) {
    const doc = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();

    if(doc.isDone == true || doc.isCancel == true || doc.requestConfirmation == true ){
      throw new ForbiddenException();
    }
   
    const history = {
      order: doc._id,
      before: doc.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.update
    }

    if(updateCancelOrderDto.isCancel == true){ 
      for (let index = 0; index < doc.products?.length; index++) {
        const product = await this.productModel.findById(doc.products[index].product)
          .byTenant(userReq.owner)
          .populateTenant('name')
          .exec();
        product.set({quantity: (product.quantity + doc.products[index].quantity)}).save();
      }

      const result = await doc.set({isCancel: true}).save();
      await this.orderProductService.updateIsDone(id, userReq);
      const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
      this.historyService.create({
        ...history,
        change,
      }, userReq);

      const notify = {
        title: "Cancel orders",
        description: `The order ${doc.name||""} with order number ${doc.orderCode} has been cancelled`,
        type: NotificationType.order,
        author: userReq ? userReq.userId : undefined,
        image: '',
        isRead: false,
        relateStaff: userReq.owner,
        object: {
          id: doc._id.toString(),
          name: doc.name||"",
          orderCode: doc.orderCode,
          discription: doc.description,
        },
        owner: userReq.owner
      };
      this.notificationService.create({ ...notify }, userReq);

      return result;
    }

    const result = await doc.set(updateCancelOrderDto).save();

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({
      ...history,
      change,
    }, userReq);
    
    return result;
  }

  async requestConfirmation(id: string, requestConfirmationOrderDto: RequestConfirmationOrderDto, userReq: JwtUser) {
    const doc = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      // .where('createdBy', userReq.userId)
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();
    if(doc.isDone == true || doc.isCancel == true || doc.requestConfirmation == true){
      throw new ForbiddenException();
    }
    if(userReq.userId != doc.createdBy._id){
      throw new ForbiddenException();
    }
    if(requestConfirmationOrderDto.requestConfirmation == true){ 
      const users = await this.userModel.find()
        .byTenant(userReq.owner)
        .where('staffRole', StaffRole.Accountant)
        .lean()
        .exec();
      if(users?.length > 0){
        for (let index = 0; index < users.length; index++) {
          const notify = {
            title: "Request confirmation order",
            description: `The order ${doc.name||""} with order number ${doc.orderCode}`,
            type: NotificationType.order,
            author: userReq ? userReq.userId : undefined,
            image: '',
            isRead: false,
            relateStaff: users[index]._id.toString(),
            object: {
              id: doc._id.toString(),
              name: doc.name||"",
              orderCode: doc.orderCode,
              discription: doc.description,
            },
            owner: userReq.owner
          };
          this.notificationService.create({ ...notify }, userReq);
        }
      }
    }
    const result = await doc.set(requestConfirmationOrderDto).save();
    return result;
  }

  async recheck(id: string, userReq: JwtUser) {
    CheckRoleStaff(userReq, StaffRole.Accountant);
    const doc = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();
    if(doc.isDone == true || doc.isCancel == true || doc.requestConfirmation != true){
      throw new ForbiddenException();
    }
    console.log(doc['createdBy']._id.toString());
    
    const notify = {
      title: "Recheck order",
      description: `Recheck order ${doc.name||""} with order number ${doc.orderCode}`,
      type: NotificationType.order,
      author: userReq ? userReq.userId : undefined,
      image: '',
      isRead: false,
      relateStaff: doc['createdBy']._id.toString(),
      object: {
        id: doc._id.toString(),
        name: doc.name||"",
        orderCode: doc.orderCode,
        discription: doc.description,
      },
      owner: userReq.owner
    };
    this.notificationService.create({ ...notify }, userReq);

    const result = await doc.set({ requestConfirmation: false }).save();
    return result;
  }

  async remove(id: string, userReq: JwtUser) {
    const data = await this.orderModel.findById(id)
      .byTenant(userReq.owner)
      .populate({
        path: 'products',
      })
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec();

    if(data.isDone == true || data.isCancel == true || data.requestConfirmation == true ){
      throw new ForbiddenException();
    }
    // if(data.isCancel == true ){
    //   throw new ForbiddenException();
    // }
    if(userReq.role == UserRole.Staff && userReq.userId != data.createdBy._id){
      throw new ForbiddenException();
    }

    for (let index = 0; index < data.products?.length; index++) {
      const product = await this.productModel.findById(data.products[index].product)
        .byTenant(userReq.owner)
        .populateTenant('name')
        .exec();
      product.set({quantity: (product.quantity + data.products[index].quantity)}).save();
    }

    const doc = await this.orderModel.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_ORDER_NOT_FOUND))
      .exec()

    this.orderProductService.delete(id);
    //delete history
    this.historyService.delete(id);
    //delete comment-reply
    this.modelOrderComment.deleteMany({ idOrder: id}).exec();
    return doc;
  }

  private async notifyOrderNotDone() {
    const begin = new Date();
    const end = new Date();
    begin.setHours(begin.getHours() - 48);
    end.setHours(end.getHours() - 24);
    begin.setHours(23, 59, 59);
    end.setHours(23, 59, 59);

    const orders = await this.orderModel.find({
      isDone: false,
      dueDate: { $gte: begin, $lte: end },
    })
      .lean()
      .exec();
  
    orders.forEach(order => {
      const notify = {
        title: "Order due",
        description: `The order ${order.name||""} with order number ${order.orderCode} has been delayed for payment`,
        type: NotificationType.order,
        author: order.createdBy ? (order.createdBy['_id'] ?? order.createdBy) : undefined,
        image: '',
        isRead: false,
        relateStaff: order.createdBy ? (order.createdBy['_id'] ?? order.createdBy) : undefined,
        object: {
          id: order._id.toString(),
          name: order.name||"",
          orderCode: order.orderCode,
          discription: order.description,
        },
        owner: order.owner
      };
      this.notificationService.create({ ...notify }, {
        userId: order.createdBy ? (order.createdBy['_id'] ?? order.createdBy) : undefined,
        username: '',
        role: UserRole.Staff,
        owner: order.createdBy ? (order.createdBy['owner'] ?? undefined) : undefined,
      });
    });
  }
  
  async findAllOrderMonth(userReq: JwtUser, userId?:string, date?: Date) {
    if(!date){
      date = new Date()
    }
    let dateDay = new Date(date.getFullYear(), (date.getMonth()+1), 0);
    const day = dateDay.getDate()
    
    let totalMoney = 0;
    let total = 0;
    let data = [];
    for (let index = 1; index <= day; index++) {
      const cmd = this.orderModel.find({$expr: {
        $and: [
            {
                "$eq": [{"$dayOfMonth": "$dueDate"}, index]
            },
            {
                "$eq": [{"$month": "$dueDate"}, (date.getMonth()+1)]
            },
            {
                "$eq": [{"$year": "$dueDate"}, date.getFullYear()]
            }
        ]
      }})
        .byTenant(userReq.owner)  
        .lean({ autopopulate: true })
        .where('isDone', true)
        .select("dueDate totalMoney")
  
      if(userReq.role == UserRole.Staff ){
        let checkStaffRole = false ;
        for (let index = 0; index < userReq.staffRole?.length; index++) {
          if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
            checkStaffRole = true;
          }
          if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Account){
            checkStaffRole = true;
          }
        }
        if(checkStaffRole != true){
          cmd.where('createdBy', userReq.userId);
        }
      }
      if(userId){
        cmd.where('createdBy', userId);
      }
      const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
      const [dataDay, totalDay] = await Promise.all([cmd.exec(), totalCmd.exec()]);

      let totalMoneyDay = 0;
      for(let index = 0; index < dataDay?.length; index++){
        totalMoneyDay += dataDay[index].totalMoney||0;
      }
      data = [...data, 
        {day: index, total: totalDay, totalMoneyDay}
      ]
      total += totalDay;
      totalMoney += totalMoneyDay;
    }

    return { total, month:`${(date.getMonth() +1)}/${date.getFullYear()}`, totalMoney, data};
  }

  async findAllOrderYear(userReq: JwtUser, userId?:string, year?: Date) {
    if(!year){
      year = new Date()
    }
    year = new Date(year)
    let totalMoney = 0;
    let total = 0;
    let data = [];
    for (let index = 1; index <= 12; index++) {
      const cmd = this.orderModel.find({$expr: {
        $and: [
            {
                "$eq": [{"$month": "$dueDate"}, index]
            },
            {
                "$eq": [{"$year": "$dueDate"}, year.getFullYear()]
            }
        ]
      }})
        .byTenant(userReq.owner)  
        .lean({ autopopulate: true })
        .where('isDone', true)
        .select("dueDate totalMoney")
  
      if(userReq.role == UserRole.Staff ){
        let checkStaffRole = false ;
        for (let index = 0; index < userReq.staffRole?.length; index++) {
          if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
            checkStaffRole = true;
          }
          if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Account){
            checkStaffRole = true;
          }
        }
        if(checkStaffRole != true){
          cmd.where('createdBy', userReq.userId);
        }
      }
      if(userId){
        cmd.where('createdBy', userId);
      }
      const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
      const [dataMonth, totalMonth] = await Promise.all([cmd.exec(), totalCmd.exec()]);

      let totalMoneyMonth = 0;
      for(let index = 0; index < dataMonth?.length; index++){
        totalMoneyMonth += dataMonth[index].totalMoney||0;
      }
      data = [...data, 
        {month: index, total: totalMonth, totalMoneyMonth}
      ]
      total += totalMonth;
      totalMoney += totalMoneyMonth;
    }

    return { total, year: year.getFullYear(), totalMoney, data};
  }

  async findAllOrderTopStaff(userReq: JwtUser, userId?: string, date?: Date){
    // if(userReq.role == UserRole.Staff){
    //   throw new ForbiddenException();
    // }
    if(!date){
      date = new Date()
    }
    date = new Date(date)

    // if(userReq.role == UserRole.Staff){
    //   const checkRole  = userReq.staffRole?.find(item => item == StaffRole.Account)
    //   if (!checkRole) {
    //     userId = userReq.userId;
    //   }
    // }

    const cmd = this.userModel.find()
      .byTenant(userReq.owner)
      .select("fullName email avatar")
    if(userId){
      cmd.where('_id', userId)
      cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
    }
    const users = await cmd.exec()

    let data = [];
    let total = 0;
    for (let index = 0; index < users?.length; index++) {
      const order = this.orderModel.find({$expr: {
        $and: [
            {
                "$eq": [{"$month": "$dueDate"}, (date.getMonth()+1)]
            },
            {
                "$eq": [{"$year": "$dueDate"}, date.getFullYear()]
            }
        ]
      }})
        .byTenant(userReq.owner)  
        .lean({ autopopulate: true })
        .select("dueDate totalMoney createdBy")
        .where('isDone', true)
        .where('createdBy', users[index]._id);

      const totalCmd = this.orderModel.countDocuments(order.getQuery());
      const [dataStaff, totalOrder] = await Promise.all([order.exec(), totalCmd.exec()]);

      let totalMoney = 0;
      for(let index = 0; index < dataStaff?.length; index++){
        totalMoney += dataStaff[index].totalMoney||0;
      }
      const customer = await this.findCustomerInMonth(users[index]._id, date, userReq)
      
      const kpi = await this.findOneKpi(users[index]._id, date, userReq)

      let percentKPITotalOrder = totalOrder *100/(kpi?.kpiTotalOrder ||0) ;
      let percentKPIOrder = totalMoney *100/(kpi?.kpiOrder ||0) ;
      let percentKPITotalCustomer = (customer?.length||0) *100/(kpi?.kpiTotalCustomer ||0);
      let numKPI = 3;
      if(!kpi?.kpiTotalOrder || kpi?.kpiTotalOrder == 0){
        numKPI -= 1;
        percentKPITotalOrder = 0;
      }
      if(!kpi?.kpiOrder || kpi?.kpiOrder == 0){
        numKPI -= 1;
        percentKPIOrder = 0;
      }
      if(!kpi?.kpiTotalCustomer || kpi?.kpiTotalCustomer == 0){
        numKPI -= 1;
        percentKPITotalCustomer = 0;
      }
      let percentKPI = 0
      percentKPI = (percentKPITotalOrder + percentKPIOrder + percentKPITotalCustomer)/numKPI;
      if(numKPI == 0){
        percentKPI = 0
      }
      data = [...data, 
        { 
          id: kpi?._id,
          userId: users[index]._id,
          email: users[index].email,
          fullName: users[index].fullName,
          avatar: users[index].avatar,
          total: totalOrder, 
          kpiTotalOrder: kpi?.kpiTotalOrder ||0,
          totalMoney: totalMoney,
          kpiOrder: kpi?.kpiOrder ||0,
          totalCustomer: customer?.length||0,
          kpiTotalCustomer: kpi?.kpiTotalCustomer ||0,
          percentKPI: Number(percentKPI.toFixed(2))||0
        }
      ]
    }

    data.sort((a, b) => (a.percentKPI < b.percentKPI) ? 1 : -1)

    total = users?.length || 0;
    return { total, month: `${(date.getMonth() +1)}/${date.getFullYear()}`, data};
  }

  async findTopStaffYear(userReq: JwtUser, userId?: string, date?: Date){
    // if(userReq.role == UserRole.Staff){
    //   throw new ForbiddenException();
    // }
    if(!date){
      date = new Date()
    }
    date = new Date(date)

    // if(userReq.role == UserRole.Staff){
    //   const checkRole  = userReq.staffRole?.find(item => item == StaffRole.Account)
    //   if (!checkRole) {
    //     userId = userReq.userId;
    //   }
    // }

    const cmd = this.userModel.find()
      .byTenant(userReq.owner)
      .select("fullName email avatar")
    if(userId){
      cmd.where('_id', userId)
      cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
    }
    const users = await cmd.exec()

    let data = [];
    let total = 0;
    for (let index = 0; index < users?.length; index++) {
      const order = this.orderModel.find({$expr: {
        $and: [
            {
                "$eq": [{"$year": "$dueDate"}, date.getFullYear()]
            }
        ]
      }})
        .byTenant(userReq.owner)  
        .lean({ autopopulate: true })
        .select("dueDate totalMoney createdBy")
        .where('isDone', true)
        .where('createdBy', users[index]._id);

      const totalCmd = this.orderModel.countDocuments(order.getQuery());
      const [dataStaff, totalOrder] = await Promise.all([order.exec(), totalCmd.exec()]);

      let totalMoney = 0;
      for(let index = 0; index < dataStaff?.length; index++){
        totalMoney += dataStaff[index].totalMoney||0;
      }
      const customer = await this.findCustomerInYear(users[index]._id, date, userReq)
      
      const kpi = await this.findKpiYear(users[index]._id, date, userReq)

      let percentKPITotalOrder = totalOrder *100/(kpi?.kpiTotalOrder ||0) ;
      let percentKPIOrder = totalMoney *100/(kpi?.kpiOrder ||0) ;
      let percentKPITotalCustomer = (customer?.length||0) *100/(kpi?.kpiTotalCustomer ||0);
      let numKPI = 3;
      if(!kpi?.kpiTotalOrder || kpi?.kpiTotalOrder == 0){
        numKPI -= 1;
        percentKPITotalOrder = 0;
      }
      if(!kpi?.kpiOrder || kpi?.kpiOrder == 0){
        numKPI -= 1;
        percentKPIOrder = 0;
      }
      if(!kpi?.kpiTotalCustomer || kpi?.kpiTotalCustomer == 0){
        numKPI -= 1;
        percentKPITotalCustomer = 0;
      }
      let percentKPI = 0
      percentKPI = (percentKPITotalOrder + percentKPIOrder + percentKPITotalCustomer)/numKPI;
      if(numKPI == 0){
        percentKPI = 0
      }
      data = [...data, 
        { 
          userId: users[index]._id,
          email: users[index].email,
          fullName: users[index].fullName,
          avatar: users[index].avatar,
          total: totalOrder, 
          kpiTotalOrder: kpi?.kpiTotalOrder ||0,
          totalMoney: totalMoney,
          kpiOrder: kpi?.kpiOrder ||0,
          totalCustomer: customer?.length||0,
          kpiTotalCustomer: kpi?.kpiTotalCustomer ||0,
          percentKPI: Number(percentKPI.toFixed(2))||0
        }
      ]
    }

    data.sort((a, b) => (a.percentKPI < b.percentKPI) ? 1 : -1)

    total = users?.length || 0;
    return { total, month: `${(date.getMonth() +1)}/${date.getFullYear()}`, data};
  }

  async findAllOrderDateLabel(userReq: JwtUser, query?: Paginate & QueryOrder & Sorting) {
    if(userReq?.levelAccount != LevelAccount.BASIC && userReq?.levelAccount != LevelAccount.ADVANCE){
      throw new ForbiddenException(ErrCode.E_NEED_HIGHER_LEVEL_ACCOUNT);
    }
    if(query.toDate < query.fromDate){
      throw new BadRequestException("toDateStart greater than toDateEnd");
    }
 
    let filter: FilterQuery<OrderDocument> = {};
    let dayEnd = new Date()
    if (query.fromDate) {
      query.fromDate = new Date(query.fromDate)
      dayEnd = new Date(query.fromDate);
      dayEnd.setHours(23, 59, 59);
      let dayStart = new Date(query.fromDate.toISOString().slice(0, 10))
      filter.dueDate =  { $gte: dayStart, $lte: dayEnd };
    }
    if (query.toDate) {
      dayEnd = new Date(query.toDate);
      dayEnd.setHours(23, 59, 59);
      filter.dueDate = { ...filter.dueDate, $lte: dayEnd };
    }
  
    const cmd = this.orderModel.find({ ...filter })
      .byTenant(userReq.owner)  
      .lean({ autopopulate: true })
      .where({'isDone': true})
    if(userReq.role == UserRole.Staff ){
      let checkStaffRole = false ;
      for (let index = 0; index < userReq.staffRole?.length; index++) {
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Accountant){
          checkStaffRole = true;
        }
        if(userReq.staffRole && userReq.staffRole[index] == StaffRole.Account){
          checkStaffRole = true;
        }
      }
      if(checkStaffRole != true){
        cmd.where('createdBy', userReq.userId);
      }
    }
    const totalCmd = this.orderModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    let lb = []
    let totalLabels = 0
    let totalMoneyLabels = 0
    const dataLabels = await this.orderLabelService.findAll(userReq)
    for (let i = 0; i < dataLabels.data?.length; i++) {
      let totalLabel = 0;
      let totalMoneyLabel = 0;
      for(let j = 0; j < data?.length; j++) {
        if(data[j].labels && !Array.isArray(data[j].labels)){
          if(dataLabels.data[i]._id.toString().indexOf(data[j].labels?._id) != -1 ) {
            totalLabel += 1;
            totalMoneyLabel += data[j].totalMoney;
          }
        }
      }
      lb = [...lb, {
        id: dataLabels.data[i]._id,
        name: dataLabels.data[i].name,
        color: dataLabels.data[i].color||"",
        totalLabel,
        totalMoneyLabel
      }]
      totalLabels += totalLabel;
      totalMoneyLabels += totalMoneyLabel;
    }

    let totalMoney = 0
    for(let index = 0; index < data?.length; index++){
      totalMoney += data[index].totalMoney||0
    }
    if((total - totalLabels) > 0){
      lb = [...lb, {
        id: LABEL.ID,
        name: LABEL.NAME,
        color: LABEL.COLOR,
        totalLabel : (total - totalLabels),
        totalMoneyLabel: (totalMoney- totalMoneyLabels)
      }]
    }

    return { total, totalMoney, labels: lb };
  }

  findOneKpi(userId: string, date: Date, authUser: JwtUser) {
    date = new Date(date)
    return this.modelUserKPI.findOne({
        $expr: {
            $and: [
                {
                    "$eq": [{"$month": "$kpiDate"}, (date.getMonth()+1)]
                },
                {
                    "$eq": [{"$year": "$kpiDate"}, date.getFullYear()]
                }
            ]
        }})
        .byTenant(authUser.owner)
        .lean({ autopopulate: true })
        .where({'userId': userId})
        .exec();
  }

  async findKpiYear(userId: string, date: Date, authUser: JwtUser) {
    date = new Date(date)

    const doc = await this.modelUserKPI.find({
      $expr: {
          $and: [
              {
                  "$eq": [{"$year": "$kpiDate"}, date.getFullYear()]
              }
          ]
      }})
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .where({'userId': userId})
      .exec();
    let kpiTotalOrder = 0;
    let kpiOrder = 0;
    let kpiTotalCustomer = 0;
    for (let index = 0; index < doc?.length; index++) {
      kpiTotalOrder += doc[index].kpiTotalOrder || 0;
      kpiOrder += doc[index].kpiOrder || 0;
      kpiTotalCustomer += doc[index].kpiTotalCustomer || 0;
    }
    return { 
      kpiTotalOrder,
      kpiOrder,
      kpiTotalCustomer
    };
  }

  findCustomerInMonth(userId: string, date: Date, authUser: JwtUser) {
    date = new Date(date)
    return this.customerModel.find({
      $expr: {
          $and: [
              {
                  "$eq": [{"$month": "$createdAt"}, (date.getMonth()+1)]
              },
              {
                  "$eq": [{"$year": "$createdAt"}, date.getFullYear()]
              }
          ]
      }})
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .where('createdBy', userId)
      .exec();
    // const totalCmd = this.customerModel.countDocuments(cmd.getQuery());
    // const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);
    // return { total, data };
  }

  findCustomerInYear(userId: string, date: Date, authUser: JwtUser) {
    date = new Date(date)
    return this.customerModel.find({
      $expr: {
          $and: [
              {
                  "$eq": [{"$year": "$createdAt"}, date.getFullYear()]
              }
          ]
      }})
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .where('createdBy', userId)
      .exec();
  }
}
