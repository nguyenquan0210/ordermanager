import { CustomerRelateTodoService } from './customer-relate/customer-relate-todo.service';
import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { nanoid } from 'nanoid';
import _ from 'lodash';
import { AttributesDynamicService } from 'src/attributes/attribute-dynamic.service';
import { AttrSubject } from 'src/attributes/interface/attrSubject';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { deleteFile, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomer } from './dto/query-customer.dto';
import { CustomerAttributeDto } from './dto/update-attr.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerAttribute } from './entities/customer-attribute.entity';
import { Customer, CustomerDocument } from './entities/customer.entity';
import { CustomerHistoriesService } from './customer-history/customer-histories.service';
import { difference } from 'src/commons/utils/difference';
import { Sorting } from 'src/commons/dto/sorting';
import { RelateCustomerService } from 'src/products/product-customer/relate-customer.service';
import { CustomerRelateStaffService } from './customer-relate/customer-relate-staff.service';
import { getExtension } from 'src/commons/utils/getExtension';
import { FileBodyDto } from 'src/commons/dto/file-upload.dto';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { Todo, TodoDocument } from 'src/todos/entities/todo.entity';
import { Product, ProductDocument } from 'src/products/entities/product.entity';
import { getArrayField, getIds } from 'src/commons/utils/collectionHelper';
import { UserRole, StaffRole, LevelAccount } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { ShowCustommer } from "src/users/interface/register-customer";
import { CustomerRelateCustomerService } from './customer-relate-customer/customer-relate-customer.service';
import { UsersService } from 'src/users/users.service';
import { ResourcesService } from 'src/resources/resources.service';
import { ResourceType } from 'src/resources/inteface/resourceType';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private _customerReleateTodo: CustomerRelateTodoService,
    private _customerHistory: CustomerHistoriesService,
    private _customerRelateStaff: CustomerRelateStaffService,
    private readonly _relateCustomerService: RelateCustomerService,
    private readonly notificationService: NotificationsService,
    private readonly customerCustomerSvc: CustomerRelateCustomerService,
    private readonly usersService: UsersService,
    private readonly resourcesService: ResourcesService,


    @Inject(AttrSubject.Customer) private attributeService: AttributesDynamicService,
  ) { }

  async create(createCustomerDto: CreateCustomerDto, authUser: JwtUser) {
    // const totalCustomer = await this.checkTotalCustomer(authUser);
    // if (totalCustomer) {
    //   throw new BadRequestException(ErrCode.E_CUSTOMER_MAX);
    // }
    //check infomation exist
    // if(createCustomerDto.email){
    //   const isEmail = await this.isEmailExist(createCustomerDto.email);
    //   if (isEmail) {
    //     throw new BadRequestException(ErrCode.E_USER_EMAIL_EXISTED);
    //   }
    // }
    const isPhone = await this.isPhoneNumberExist(createCustomerDto.phone, authUser);
    if (isPhone) {
      throw new BadRequestException(ErrCode.E_USER_PHONE_EXISTED);
    }

    // check all required attributes
    const requiredAttrs = await this.attributeService.findAllRequired(authUser);
    for (let i = 0; i < requiredAttrs.length; i++) {
      const attr = requiredAttrs[i];
      const dataAttribute = createCustomerDto.attributes?.find(data => data.attribute == attr._id);
      if (!dataAttribute) {
        throw new BadRequestException({
          error: "Bad Request",
          message: ErrCode.E_ATTRIBUTE_REQUIRED,
          detail: `${attr.name} is required`
        })
      }
    }

    if (createCustomerDto.attributes) {
      for await (const attr of createCustomerDto.attributes) {
        await this.validateAttributes(attr);
      }
    }

    var customer = await new this.customerModel(createCustomerDto)
      .withTenant(authUser.owner)
    customer.createdBy = authUser == null ? "" : authUser.userId;
    await customer.save()
    await this.createRelate(customer, createCustomerDto, authUser);

    // this.addNotification(customer, authUser);

    return customer;
  }

  // async checkTotalCustomer(userReq: JwtUser) {
  //   let cus = this.customerModel.find().byTenant(userReq.owner);
  //   const totalCmd = this.customerModel.countDocuments(cus.getQuery());
  //   const [total] = await Promise.all([totalCmd.exec()]);
  //   return total >= LEVEL_ACCOUNT[authUser.levelAccount|| LevelAccount.FREE].CUSTOMER;
  // }

  async findAll(authUser: JwtUser, query?: Paginate & QueryCustomer & Sorting) {

    const owner = await this.userModel.findById(authUser.owner)
      .exec();

    const filter: FilterQuery<CustomerDocument> = {};
    if (query.search) {
      filter.$or = [
        { $text: { $search: `.*${query.search}.*`, $language: "en" } },
        { phone: { $regex: `^${query.search}` } },
        { phone: { $regex: `${query.search}$` } },
      ]
    }

    if (query.toDate) {
      filter.createdAt = { $gte: query.toDate };
    }
    if (query.fromDate) {
      filter.createdAt = { ...filter.createdAt, $lte: query.fromDate };
    }

    const cmd = this.customerModel.find({ ...filter })
      .byTenant(authUser.owner)
      .populate("labels")
      .populate("demands")
      .populate({
        path: 'relateStaffs',
        populate: { path: 'staff', select: 'username fullName birth phone avatar' }
      })
      .populate({
        path: 'relateProducts',
        populate: {
          path: 'product',
          select: 'name description imageList videoList fileList owner attributes category status labels price malo commissionFee address code dientich information'
        }
      })
      .populate({
        path: 'relateTodos',
        populate: { path: 'todo', select: 'name description' }
      })
      .populate({
        path: 'relateCustomer', select: 'fullName avatar'
      })
      .lean();

    if (query.labels && query.labels.length) {
      let labels;
      if (typeof query.labels == 'string') {
        labels = [query.labels]
      } else {
        labels = query.labels;
      }
      cmd.where('labels').in(labels);
    }

    if(authUser.role == UserRole.Staff && 
      authUser.staffRole?.find(item => item == StaffRole.AssignTodo) == undefined){
      if(owner?.showCustommer == ShowCustommer.private){
        cmd.where('createdBy', authUser.userId);
      }
    }

    if (query.demands) {
      const arr: string[] = [];
      if (typeof query.demands === 'string') {
        arr.push(query.demands);
      } else {
        arr.push(...query.demands);
      }
      cmd.where('demands').in(arr);
    }

    if (query.country) {
      cmd.where('country', query.country);
    }
    if (query.addressCity) {
      cmd.where('addressCity', query.addressCity);
    }
    if (query.addressDistrict) {
      cmd.where('addressDistrict', query.addressDistrict);
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

    const totalCmd = this.customerModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);
    return { total, data };
  }

  async checkCustomerExisted(userReq: JwtUser, email?: string, phone?: string) {
    if(email){
      const isEmail = await this.isEmailExist(email, userReq);
      if (isEmail) {
        throw new BadRequestException(ErrCode.E_USER_EMAIL_EXISTED);
      }
    }
    if(phone){
      const isPhone = await this.isPhoneNumberExist(phone, userReq);
      if (isPhone) {
        throw new BadRequestException(ErrCode.E_USER_PHONE_EXISTED);
      }
    }
    return true;
  }

  findOne(id: string, authUser: JwtUser) {
    return this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .populate("demands")
      .populate({
        path: 'relateTodos',
        populate: { path: 'todo', select: 'name description' }
      })
      .populate({
        path: 'relateProducts',
        populate: { path: 'product' }
      })
      .populate({
        path: 'relateStaffs',
        populate: { path: 'staff', select: 'username fullName birth phone avatar' }
      })
      .populate({
        path: 'relateCustomer', select: 'fullName avatar'
      })
      .populate({ path: 'notes' })
      .populate({ path: 'relateCustomers' })
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();
  }

  async getNotRelateStaffs(id: string, authUser: JwtUser) {
    var doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .populate("relateStaffs")
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    var relateStaffs = getArrayField(doc.relateStaffs, "staff");
    var cmd = this.userModel.find({ _id: { $nin: relateStaffs } })
      .where('role').in([UserRole.Staff.toString()]);
    
    // var cmd = this.userModel.find({}).select('_id fullName gender role userCode accountType email phone').where('_id').in(relateStaffs)

    const totalCmd = this.userModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  async getNotRelateProducts(id: string, authUser: JwtUser) {
    var doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .populate("relateProducts")
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    var relateProducts = getArrayField(doc.relateTodos, "product");

    var cmd = this.productModel.find({ _id: { $nin: relateProducts } });
    const totalCmd = this.productModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  async getNotRelateTodos(id: string, authUser: JwtUser) {
    var doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .populate("relateTodos")
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    var relateTodos = getArrayField(doc.relateTodos, "todo");

    var cmd = this.todoModel.find({ _id: { $nin: relateTodos } });
    const totalCmd = this.todoModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, authUser: JwtUser) {

    var doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();
    if(authUser.role == UserRole.Staff && authUser.userId != doc.createdBy){
      throw new ForbiddenException();
    }

    if(updateCustomerDto.phone && doc.phone != updateCustomerDto.phone){
      const isPhone = await this.isPhoneNumberExist(updateCustomerDto.phone, authUser);
      if (isPhone) {
        throw new BadRequestException(ErrCode.E_USER_PHONE_EXISTED);
      }
    }
    const history = {
      customer: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
    };

    var result = await doc.set(updateCustomerDto);
    await this.updateRelate(doc, updateCustomerDto);

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    return result.save();
  }
  
  async remove(id: string, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Customers);
    if(authUser.role == UserRole.Staff){
      throw new ForbiddenException();
    }
    const data = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    // staff delete customer
    // if(authUser.role == UserRole.Staff && authUser.userId != data.createdBy){
    //   throw new ForbiddenException();
    // }
    const doc = await this.customerModel.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .populate("labels")
      .populate("relateProducts")
      .populate("relateTodos")
      .populate("relateStaffs")
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    // const history = {
    //   customer: doc._id,
    //   before: doc.toJSON(),
    //   updatedBy: authUser.userId,
    // };

    // delete avatar
    // if (doc.avatar) {
    //   const res = await deleteFile(doc.avatar);
    // }

    await this.deleteRalate(doc);
    // const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    // this._customerHistory.create({ ...history, change }, authUser);
    this._customerHistory.delete(id);

    return doc;
  }

  async uploadAvatar(id: string, file: Express.Multer.File, authUser: JwtUser) {
   
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .exec();

    const history = {
      customer: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
    };
    const avatar = await this.resourcesService.createAndUploadFile(file, authUser, ResourceType.Image, 'avatar customer');
    // const random = nanoid(16);
    // const url = `customers/avatars/${authUser.owner ?? 'default'}/${random}.png`;
    // await uploadFile({
    //   file: file,
    //   filePath: url,
    //   mimetype: file.mimetype
    // });
    
    doc.avatar = avatar.url;
    const result = await doc.save();

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    return result;
  }

  async getAvatarSignedUrl(id: string, fileName: string) {
    const fileKey = `customers/avatars/${id}/${fileName}`;
    const url = await signedUrl(fileKey);
    return url;
  }

  private async validateAttributes(attr: CustomerAttribute) {
    return this.attributeService.validateAttribute(attr);
  }

  async updateAttribute(CustomerId: string, attrDto: CustomerAttributeDto, authUser: JwtUser) {
    await this.validateAttributes(attrDto);

    const customer = await this.customerModel.findById(CustomerId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const updateAttr = customer.attributes.find(attr =>
      attr.attribute['_id'].equals(attrDto.attribute));
    if (updateAttr) {
      updateAttr.set(attrDto);
    } else {
      // add new attribute
      customer.attributes.push({ attribute: attrDto.attribute, value: attrDto.value });
    }

    return await customer.save();
  }

  async deleteAttribute(CustomerId: string, attrId: string, authUser: JwtUser) {
    const requiredAttrs = await this.attributeService.findAllRequired(authUser);
    const isRequired = requiredAttrs.find(attr => attr._id.equals(attrId));
    if (isRequired) {
      throw new BadRequestException({
        error: "Bad Request",
        message: ErrCode.E_ATTRIBUTE_REQUIRED,
        detail: `${isRequired.name} is required`
      })
    }

    const customer = await this.customerModel.findById(CustomerId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();
    const idx = customer.attributes.findIndex(a => a.attribute['_id'].equals(attrId));
    if (idx > -1) {
      customer.attributes.splice(idx, 1);
    }
    return await customer.save();
  }

  //#region relateProduct
  async addRelateProduct(id: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    return await this._relateCustomerService.addCustomerRelateProduct(doc, productIds);
  }

  async updateRelateProduct(id: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    return await this._relateCustomerService.updateRelateProduct(doc, productIds);
  }

  async removeRelateProduct(id: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    return this._relateCustomerService.removeMultiple(id, productIds);
  }

  async changeRelateProducts(id: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();
    const oldProducts = await this._relateCustomerService.findAll({ customer: id });
    const oldIds = oldProducts.map(product => product._id);
    await this._relateCustomerService.removeMultiple(id, oldIds);
    const res = await this._relateCustomerService.addCustomerRelateProduct(doc, productIds);
    return res;
  }
  //#endregion

  //#region Relate Staff
  async addRelateStaffs(id: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    const result = this._customerRelateStaff.createAsync(doc, staffIds);
    return result;
  }

  async updateRelateStaffs(id: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    const result = this._customerRelateStaff.updateRelateStaff(doc, staffIds);
    return result;
  }

  async removeRelateStaffs(id: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    const result = this._customerRelateStaff.remove(id, staffIds);

    return result;
  }

  async changeRelateStaffs(id: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const oldStaffs = await this._customerRelateStaff.findAll({ customer: id });
    const oldIds = oldStaffs.map(staff => staff._id);
    await this._customerRelateStaff.remove(id, oldIds);
    const result = this._customerRelateStaff.createAsync(doc, staffIds);
    return result;
  }
  //#endregion

  async updateRelateTodos(id: string, todoIs: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    const result = this._customerReleateTodo.updateRelateTodo(doc, todoIs);
    return result;
  }
  //#region Relate Todos
  async addRelateTodos(id: string, todoIs: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    const result = this._customerReleateTodo.createAsync(doc, todoIs);
    return result;
  }

  async removeRelateTodos(id: string, todoIs: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const history = { customer: doc._id, before: doc.toJSON(), updatedBy: authUser.userId };
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this._customerHistory.create({ ...history, change }, authUser);

    const result = this._customerReleateTodo.remove(id, todoIs);

    return result;
  }

  //#endregion
  // async uploadImage(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string, description?: string) {
  //   const customer = await this.customerModel.findById(id)
  //     .byTenant(userReq.owner)
  //     .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
  //     .exec();

  //   const history = {
  //     customer: customer._id,
  //     before: customer.toJSON(),
  //     updatedBy: userReq.userId,
  //   };

  //   const ext = getExtension(file.originalname);
  //   const random = nanoid(24) + `${ext ? `.${ext}` : ''}`;
  //   const url = `customers/${userReq.owner ?? 'default'}/${customer._id}/images/${random}`;

  //   // move file to proper path
  //   const output = await uploadFile({
  //     file: file,
  //     filePath: url,
  //     mimetype: file.mimetype
  //   })

  //   customer.imageList.push({
  //     name: filename || file.originalname,
  //     description: description,
  //     url: url,
  //     mimetype: file.mimetype,
  //     size: file.size
  //   });

  //   const result = await customer.save();

  //   const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
  //   this._customerHistory.create({
  //     ...history,
  //     change,
  //   }, userReq);

  //   return result;
  // }

  async geImageSignedUrl(id: string, owner: string, fileName: string) {
    const fileKey = `customers/${owner}/${id}/images/${fileName}`;
    const url = await signedUrl(fileKey);
    return url;
  }

  /**
   * update images
   * @param id 
   * @param fileId 
   * @param userReq 
   */
  // async updateImage(id: string, fileId: string, userReq: JwtUser, info: FileBodyDto) {
  //   const customer = await this.customerModel.findById(id)
  //     .byTenant(userReq.owner)
  //     .select('imageList')
  //     .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
  //     .exec();

  //   const fileObj = customer.imageList.find(f => f['_id'] == fileId);
  //   if (!fileObj) {
  //     throw new BadRequestException(ErrCode.E_CUSTOMER_FILE_NOT_FOUND);
  //   }

  //   const history = {
  //     customer: customer._id,
  //     before: customer.toJSON(),
  //     updatedBy: userReq.userId,
  //   }

  //   fileObj.name = info.name;
  //   fileObj.description = info.description;

  //   const result = await customer.save();

  //   const change = { imageList: result.toJSON().imageList };
  //   this._customerHistory.create({ ...history, change, }, userReq);

  //   return result;
  // }

  // async deleteImage(id: string, fileId: string, userReq: JwtUser) {
  //   const customer = await this.customerModel.findById(id)
  //     .byTenant(userReq.owner)
  //     .select('imageList')
  //     .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
  //     .exec();

  //   const fileObj = customer.imageList.find(f => f['_id'] == fileId);
  //   if (!fileObj) {
  //     throw new BadRequestException(ErrCode.E_CUSTOMER_FILE_NOT_FOUND);
  //   }

  //   const history = {
  //     customer: customer._id,
  //     before: customer.toJSON(),
  //     updatedBy: userReq.userId,
  //   }
  //   fileObj.deleteFile();
  //   customer.imageList.pull(fileObj);

  //   const result = await customer.save();

  //   const change = { customer: result.toJSON() };
  //   this._customerHistory.create({ ...history, change, }, userReq);
  //   return result;
  // }

  //#region private
  async addDemands(id: string, demandIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    if (demandIds) {
      for (let index = 0; index < demandIds.length; index++) {
        doc.demands.addToSet(demandIds[index]);
      }
    }

    const result = await doc.save();
    return result;
  }

  async changeDemands(id: string, demandIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    while (doc.demands.length) {
      doc.demands.pop();
    }

    if (demandIds) {
      for await (const item of demandIds) {
        doc.demands.push(item);
      }
    }

    const result = await doc.save();

    return result;
  }

  async removeDemands(id: string, demandIds: string[], authUser: JwtUser) {
    const doc = await this.customerModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    demandIds.forEach((item) => {
      var todo = doc.demands.find(f => f['_id'].equals(item));
      if (todo) {
        doc.demands.pull(item)
      }
    });

    const result = await doc.save();

    return result;
  }
  //#endregion

  //#region private
  private async createRelate(doc: CustomerDocument, obj: CreateCustomerDto, authUser: JwtUser) {
    if (doc._id) {
      await this.addRelateProduct(doc._id, obj.relateProducts, authUser);
      await this.addRelateTodos(doc._id, obj.relateTodos, authUser);
      await this.addRelateStaffs(doc._id, obj.relateStaffs, authUser);

      if (obj.relateCustomers?.length) {
        obj.relateCustomers.forEach(async customer => {
          await this.customerCustomerSvc.create({
            ...customer,
            customer: doc._id,
          }, authUser)
        });
      }
    }
  }

  private async updateRelate(doc: CustomerDocument, obj: UpdateCustomerDto) {
    await this._customerRelateStaff.updateRelateStaff(doc, obj.relateStaffs);
    await this._customerReleateTodo.updateRelateTodo(doc, obj.relateTodos);
    await this._relateCustomerService.updateRelateProduct(doc, obj.relateProducts);

    if (obj.relateCustomers?.length) {
      obj.relateCustomers.forEach(async info => {
        await this.customerCustomerSvc.updateMany({
          customer: doc._id,
          customer1: info.customer1,
        }, {
          relateName: info.relateName,
        }, {
          upsert: true,
        })
      });
    }
  }

  private async deleteRalate(doc: CustomerDocument) {
    await this._customerRelateStaff.delete(getIds(doc.relateStaffs));
    await this._customerReleateTodo.delete(getIds(doc.relateTodos));
    await this._relateCustomerService.delete(getIds(doc.relateProducts));

    await this.customerCustomerSvc.deleteMany({ customer: doc._id });
  }

  private async isPhoneNumberExist(phoneNumber: string, authUser: JwtUser) {
    let customer = await this.customerModel.findOne({ phone: phoneNumber })
    .byTenant(authUser.owner)
    .exec();
    if (customer) {
      return true;
    }
    return false;
  }

  private async isEmailExist(email: string, authUser: JwtUser) {
    let customer = await this.customerModel.findOne({ email: email })
    .byTenant(authUser.owner)
    .exec();
    if (customer) {
      return true;
    }
    return false;
  }
  //#endregion

  private addNotification(customer: CustomerDocument, userReq: JwtUser) {
    var urlImage = customer.avatar ? customer.avatar : "";
    var notify = {
      title: customer.fullName,
      description: customer.note,
      type: NotificationType.customer,
      author: userReq.userId,
      image: urlImage,
      isRead: false,
      object: { id: customer.id, fullName: customer.fullName, note: customer.note },
      owner: userReq.owner
    };

    this.notificationService.create({ ...notify }, userReq);
  }
}
