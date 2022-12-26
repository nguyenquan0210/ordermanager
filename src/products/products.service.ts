import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import _, { map } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { AttributesDynamicService } from 'src/attributes/attribute-dynamic.service';
import { AttrSubject } from 'src/attributes/interface/attrSubject';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { PRODUCT_CTG } from 'src/commons/constants/schemaConst';
import { FileBodyDto } from 'src/commons/dto/file-upload.dto';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Report } from 'src/commons/dto/report.dto';
import { Sorting, SortOrder } from 'src/commons/dto/sorting';
import { StatusHistory } from 'src/commons/dto/status.dto';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { getArrayField } from 'src/commons/utils/collectionHelper';
import { difference } from 'src/commons/utils/difference';
import { filterParams } from 'src/commons/utils/filterParams';
import { getExtension } from 'src/commons/utils/getExtension';
import { deleteManyFiles, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { Customer, CustomerDocument } from 'src/customers/entities/customer.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UserRole, StaffRole, LevelAccount } from 'src/users/interface/userRoles';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProduct } from './dto/query-product.dto';
import { ProductAttributeDto } from './dto/update-attr.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductAttribute } from './entities/product-attribute.entity';
import { Product, ProductDocument } from './entities/product.entity';
import { HistoriesService } from './histories/histories.service';
import { RelateCustomerService } from './product-customer/relate-customer.service';
import { RelateTodoService } from './product-todo/relate-todo.service';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { ORDER_PRODUCT } from 'src/commons/constants/schemaConst';
import { OrderProductDocument, OrderProduct } from 'src/orders/entities/order-product.entity';
import { UsersService } from 'src/users/users.service';
import { ResourcesService } from 'src/resources/resources.service';
import { ResourceType } from 'src/resources/inteface/resourceType';
import { RelateDepartmentService } from './product-department/relate-department.service';
import { CreateRelateArrDepartmentDto } from './product-department/dto/create-product-rle-arrDepartment.dto';
import { StaticFile } from 'src/commons/utils/staticFile';
import { RelateColorService } from './products-ralate-color/relate-color.service';
import { CreateRelateArrColorDto } from './products-ralate-color/dto/create-product-rle-arr-color.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ORDER_PRODUCT) private modelOrderProduct: Model<OrderProductDocument>,
    @Inject(AttrSubject.Product) private attributeService: AttributesDynamicService,
    private readonly historyService: HistoriesService,
    private readonly relateService: RelateCustomerService,
    //private readonly relateDepartmentService: RelateDepartmentService,
    private readonly relateColorService: RelateColorService,
    private readonly relateTodoService: RelateTodoService,
    private readonly notificationService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly resourcesService: ResourcesService
  ) { }

  async create(createProductDto: CreateProductDto, userReq: JwtUser) {
    // check all required attributes
    // const requiredAttrs = await this.attributeService.findAllRequired(userReq);
    // for (let i = 0; i < requiredAttrs.length; i++) {
    //   const attr = requiredAttrs[i];
    //   const dataAttribute = createProductDto.attributes?.find(data => data.attribute == attr._id);
    //   if (!dataAttribute) {
    //     throw new BadRequestException({
    //       error: "Bad Request",
    //       message: ErrCode.E_ATTRIBUTE_REQUIRED,
    //       detail: `${attr.name} is required`
    //     })
    //   }
    // }

    // if (createProductDto.attributes) {
    //   for await (const attr of createProductDto.attributes) {
    //     await this.validateAttributes(attr);
    //   }
    // }



    CheckRoleStaff(userReq, StaffRole.Product)

    if(createProductDto.productCode){
      const productCode = await this.isProductCodeExist(createProductDto.productCode, userReq);
      if (productCode) {
        throw new BadRequestException(ErrCode.E_PRODUCT_CODE_EXISTED);
      }
    }

    if(createProductDto.priceSale && createProductDto.price < createProductDto.priceSale){
      throw new BadRequestException('Price must be greater than PriceSale');
    }

    if(createProductDto.quantity <= 0){
      throw new BadRequestException('Quantity must be greater than 0');
    }
    
    const product = await new this.productModel(createProductDto)
      .withTenant(userReq.owner)
      .save();

    if (createProductDto.relateTodos) {
      await this.relateTodoService.addRelateTodo(product._id, createProductDto.relateTodos);
    }
    this.addNotification(product, userReq);

    return product;
  }

  async isProductCodeExist(productCode: string, userReq: JwtUser) {
    let product = await this.productModel.findOne({ productCode: productCode }).byTenant(userReq.owner).exec();
    if (product) {
      return true;
    }
    return false;
  }

  async checkProductCode(userReq: JwtUser, productCode: string ) {
    const check = await this.isProductCodeExist(productCode, userReq);
    if (check) {
      throw new BadRequestException(ErrCode.E_PRODUCT_CODE_EXISTED);
    }
    return true;
  }

  async findAll(userReq?: JwtUser, query?: Paginate & QueryProduct & Sorting) {
    let filter: FilterQuery<ProductDocument> = {};

    if (query.search) {
      filter.$text = { $search: `.*${query.search}.*`, $language: "en" };
    }

    const cond = filterParams(query, ['category', 'malo', 'code']);
    const cmd = this.productModel.find({ ...filter, ...cond })
      .byTenant(userReq?.owner, true)
      .populate({
        path: 'relateCustomers', select: '-_id',
        populate: { path: 'customer', select: 'fullName email phone avatar' }
      })
      .populate({
        path: 'relateTodos',
        populate: { path: 'todo', select: 'name description startDate dueDate priority status' }
      })
      .lean({ autopopulate: true })

    if (query.isOwner) {
      cmd.where('owner', userReq.owner);
    }
    if (query.isHot) {
      cmd.where('isHot', query.isHot);
    }
    if (query.labels) {
      if (Array.isArray(query.labels) && query.labels.length > 0) {
        cmd.where('labels').in(query.labels);
      } else {
        cmd.where('labels', query.labels);
      }
    }
    if (query.states) {
      if (Array.isArray(query.states) && query.states.length > 0) {
        cmd.where('status').in(query.states);
      } else {
        cmd.where('status', query.states);
      }
    }
    if (query.fromPrice) {
      cmd.where('price').gte(query.fromPrice);
    }
    if (query.toPrice) {
      cmd.where('price').lte(query.toPrice);
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

    const totalCmd = this.productModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  async findAllClient(query?: Paginate & QueryProduct & Sorting) {
    let filter: FilterQuery<ProductDocument> = {};

    if (query.search) {
      filter.$text = { $search: `.*${query.search}.*`, $language: "en" };
    }

    const cond = filterParams(query, ['category', 'malo', 'code']);
    const cmd = this.productModel.find({ ...filter, ...cond })
      .byTenant(null, true)
      .populate({
        path: 'relateCustomers', select: '-_id',
        populate: { path: 'customer', select: 'fullName email phone avatar' }
      })
      .populate({
        path: 'relateTodos',
        populate: { path: 'todo', select: 'name description startDate dueDate priority status' }
      })
      .lean({ autopopulate: true })

    // if (query.isOwner) {
    //   cmd.where('owner', userReq.owner);
    // }
    if (query.isHot) {
      cmd.where('isHot', query.isHot);
    }
    if (query.labels) {
      if (Array.isArray(query.labels) && query.labels.length > 0) {
        cmd.where('labels').in(query.labels);
      } else {
        cmd.where('labels', query.labels);
      }
    }
    if (query.states) {
      if (Array.isArray(query.states) && query.states.length > 0) {
        cmd.where('status').in(query.states);
      } else {
        cmd.where('status', query.states);
      }
    }
    if (query.fromPrice) {
      cmd.where('price').gte(query.fromPrice);
    }
    if (query.toPrice) {
      cmd.where('price').lte(query.toPrice);
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

    const totalCmd = this.productModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }


  findOne(id: string, userReq: JwtUser) {
    return this.productModel.findById(id)
      .byTenant(userReq.owner)
      .populate({
        path: 'relateCustomers', select: '-_id',
        populate: { path: 'customer', select: 'fullName email phone avatar' }
      })
      .populate({
        path: 'relateTodos', select: '-_id',
        populate: { path: 'todo', select: 'name description' }
      })
      .populateTenant('username')
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();
  }

  async featuredProducts(userReq: JwtUser) {
    const cmd = this.productModel.find({});

    cmd.byTenant(userReq.owner)
      .lean({ autopopulate: true })
      .where('isHot', true)
      .sort({ ['createdAt']: SortOrder.desc })
      .limit(5)
      .select('name status labels imageList');

    const totalCmd = this.productModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);

    return { total, data }
  }

  async transactions(userReq: JwtUser) {
    const cmd = this.productModel.find({});
    cmd.byTenant(userReq.owner)
      .populate({
        path: 'relateCustomers', select: '-_id', options: { limit: 1 },
        populate: { path: 'customer', select: 'fullName email phone avatar' }
      })
      .lean({ autopopulate: true })
      .sort({ ['createdAt']: SortOrder.desc })
      .select('name status labels relateCustomers -relateStaffs -carerStaffs -category');

    const [result] = await Promise.all([cmd.exec()]);
    var data = result.filter((v, x) => v.relateCustomers.length != 0 && x <= 10);
    const total = data.length;

    return { total, data }
  }

  //#region Not Relate
  async getNotRelateCustomers(id: string, authUser: JwtUser) {
    var doc = await this.productModel.findById(id)
      .byTenant(authUser.owner)
      .populate("relateCustomers")
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    var relateCustomers = getArrayField(doc.relateCustomers, "customer");
    var cmd = this.customerModel.find({ _id: { $nin: relateCustomers } });
    const totalCmd = this.customerModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  async getNotRelateStaffs(id: string, authUser: JwtUser) {
    var doc = await this.productModel.findById(id)
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    var relateStaffs = getArrayField(doc.relateStaffs, "_id");
    var cmd = this.userModel.find({ _id: { $nin: relateStaffs } })
      .where('role').in([UserRole.Staff.toString()]);

    const totalCmd = this.userModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }
  //#endregion

  async update(id: string, updateProductDto: UpdateProductDto, userReq: JwtUser) {
    CheckRoleStaff(userReq, StaffRole.Product)
    if (updateProductDto.attributes) {
      // check all required attributes
      const requiredAttrs = await this.attributeService.findAllRequired(userReq);
      for (let i = 0; i < requiredAttrs.length; i++) {
        const attr = requiredAttrs[i];
        const dataAttribute = updateProductDto.attributes?.find(data => data.attribute == attr._id);
        if (!dataAttribute) {
          throw new BadRequestException({
            error: "Bad Request",
            message: ErrCode.E_ATTRIBUTE_REQUIRED,
            detail: `${attr.name} is required`
          })
        }
      }

      for await (const attr of updateProductDto.attributes) {
        await this.validateAttributes(attr);
      }
    }
    const doc = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();
    
    if( updateProductDto.price && updateProductDto.priceSale ) {
      if( updateProductDto.price < updateProductDto.priceSale ) {
        throw new BadRequestException('Price must be greater than PriceSale');
      }
    }
    if( !updateProductDto.price && updateProductDto.priceSale ) {
      if( doc.price < updateProductDto.priceSale ) {
        throw new BadRequestException('Price must be greater than PriceSale');
      }
    }
    if( updateProductDto.price && !updateProductDto.priceSale ) {
      if( updateProductDto.price < doc.priceSale ) {
        throw new BadRequestException('Price must be greater than PriceSale');
      }
    }

    if(updateProductDto.productCode && updateProductDto.productCode != doc.productCode ){
      const productCode = await this.isProductCodeExist(updateProductDto.productCode, userReq);
      if (productCode) {
        throw new BadRequestException(ErrCode.E_PRODUCT_CODE_EXISTED);
      }
    }
      
    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.update
    }

    const result = await doc.set(updateProductDto).save();

    if (updateProductDto.relateTodos) {
      await this.relateTodoService.addRelateTodo(result._id, updateProductDto.relateTodos);
    }

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({
      ...history,
      change,
    }, userReq);

    return result;
  }

  async remove(id: string, userReq: JwtUser) {
    // CheckRoleStaff(userReq, StaffRole.Product)
    if(userReq.role == UserRole.Staff){
      throw new ForbiddenException();
    }
    const cmd = await this.modelOrderProduct.findOne({ product: id })
      .byTenant(userReq.owner)
      .where('isDone', false)
      .exec();
    if(cmd){
      throw new ForbiddenException(ErrCode.E_PRODUCT_IN_ORDER_NOT_DONE);
    }
    const doc = await this.productModel.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec()
    // const keys = [];
    // for (let i = 0; i < doc.imageList.length; i++) {
    //   keys.push(doc.imageList[i].url);
    // }

    // for (let i = 0; i < doc.videoList.length; i++) {
    //   keys.push(doc.videoList[i].url);
    // }

    // for (let i = 0; i < doc.fileList.length; i++) {
    //   keys.push(doc.fileList[i].url);
    // }

    // if(keys.length > 0){
    //   const data = await deleteManyFiles(keys);
    // }
    return doc;
  }

  async uploadImage(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string, description?: string) {
    
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();
    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.create
    }
   
    const url = `products/${userReq.owner}/${id}/${ResourceType.Image}/${file.filename}`;

    product.imageList.push({
      description: description,
      name: filename || file.originalname,
      url: url,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await product.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);

    this.historyService.create({ ...history, change }, userReq);

    return result;
  }

  async uploadVideo(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();
    //const video = await this.resourcesService.createAndUploadFile(file, userReq, ResourceType.Video, 'video product', filename)
    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.create
    }
    const url = `products/${userReq.owner}/${id}/${ResourceType.Video}/${file.filename}`;

    product.videoList.push({
      name: filename || file.originalname,
      url: url,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await product.save();

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);

    this.historyService.create({
      ...history,
      change,
    }, userReq);
    return result;
  }

  async uploadFile(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.create
    }
    //const files = await this.resourcesService.createAndUploadFile(file, userReq, ResourceType.File, 'file product', filename)
    const url = `products/${userReq.owner}/${id}/${ResourceType.File}/${file.filename}`;

    product.fileList.push({
      name: filename || file.originalname,
      url: url,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await product.save();

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({
      ...history,
      change,
    }, userReq);
    return result;
  }

  async uploads(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {   
    
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.create
    }
    const types = this.getFileType(file.mimetype);

    //const allFile = await this.resourcesService.createAndUploadFile(file, userReq, ResourceType[types],  `${types} product`, filename)
    const url = `products/${userReq.owner}/${id}/${ResourceType[types]}/${file.filename}`;

    const fileInfo = {
      name: filename || file.originalname,
      url: url,
      mimetype: file.mimetype,
      size: file.size
    };

    if (types == 'Image')
      product.imageList.push(fileInfo)
    else if (types == 'Video')
      product.videoList.push(fileInfo);
    else
      product.fileList.push(fileInfo);

    const result = await product.save();

    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, userReq);
    return result;
  }

  getFileType(mimetype: string) {
    if (mimetype.indexOf('image') != -1) return 'Image';
    if (mimetype.indexOf('video') != -1) return 'Video';
    return 'File';
  }

  async deleteFile(id: string, fileId: string, userReq: JwtUser) {
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .select('fileList')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const fileObj = product.fileList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_PRODUCT_FILE_NOT_FOUND);
    }
    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.delete
    }

    // fileObj.deleteFile();
    product.fileList.pull(fileObj);

    const result = await product.save();

    const change = result.fileList.filter(x => x !== null);
    this.historyService.create({ ...history, change, }, userReq);
    return result;
  }

  async deleteImage(id: string, fileId: string, userReq: JwtUser) {
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .select('imageList')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const fileObj = product.imageList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_PRODUCT_FILE_NOT_FOUND);
    }

    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.delete
    }
    // fileObj.deleteFile();
    product.imageList.pull(fileObj);

    const result = await product.save();
    const change = result.imageList.filter(x => x !== null);
    this.historyService.create({ ...history, change: change }, userReq);
    return result;
  }

  async deleteVideo(id: string, fileId: string, userReq: JwtUser) {
    const product = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .select('videoList')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const fileObj = product.videoList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_PRODUCT_FILE_NOT_FOUND);
    }

    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.delete
    }
    // fileObj.deleteFile();
    product.videoList.pull(fileObj);

    const result = await product.save();
    const change = result.videoList.filter(x => x !== null);

    this.historyService.create({ ...history, change: change }, userReq);
    return result;
  }

  getSignedUrl(id: string, owner: string, type: string, fileName: string) {
    const key = StaticFile.getLocalFileUpload('products', fileName);
    return key;
  }

  //#region Attributes
  private async validateAttributes(attr: ProductAttribute) {
    return this.attributeService.validateAttribute(attr);
  }

  async updateAttribute(productId: string, attrDto: ProductAttributeDto, authUser: JwtUser) {
    await this.validateAttributes(attrDto);

    const product = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.update
    }
    const updateAttr = product.attributes.find(attr =>
      attr.attribute['_id'].equals(attrDto.attribute));
    if (updateAttr) {
      updateAttr.set(attrDto);
    } else {
      // add new attribute
      product.attributes.push({ attribute: attrDto.attribute, value: attrDto.value });
    }
    const result = await product.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change, }, authUser);

    return result;
  }

  async deleteAttribute(productId: string, attrId: string, authUser: JwtUser) {
    const requiredAttrs = await this.attributeService.findAllRequired(authUser);
    const isRequired = requiredAttrs.find(attr => attr._id.equals(attrId));
    if (isRequired) {
      throw new BadRequestException({
        error: "Bad Request",
        message: ErrCode.E_ATTRIBUTE_REQUIRED,
        detail: `${isRequired.name} is required`
      })
    }

    const product = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: product._id,
      before: product.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.delete
    }
    const idx = product.attributes.findIndex(a => a.attribute['_id'].equals(attrId));
    if (idx > -1) {
      product.attributes.splice(idx, 1);
    }
    const result = await product.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change, }, authUser);

    return result;
  }
  //#endregion

  //#region add Relate Staff
  async addRelateStaffs(productId: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .select('relateStaffs')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    doc.relateStaffs.addToSet(...staffIds);

    const result = await doc.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async updateRelateStaffs(productId: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .select('relateStaffs')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    doc.relateStaffs.pull(...doc.relateStaffs);
    doc.relateStaffs.addToSet(...staffIds);

    const result = await doc.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateStaff(productId: string, staffIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .select('relateStaffs')
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.removeRelate
    };

    doc.relateStaffs.pull(...staffIds);

    const result = await doc.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);

    this.historyService.create({ ...history, change }, authUser);

    return result;
  }
  //#endregion

  //#region add Relate Customer
  async addRelateCustomers(productId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateService.addRelateCustomer(doc._id, customerIds);
    const change = _.omit(difference(customerIds.toString(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async updateRelateCustomers(productId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateService.updateRelateCustomer(doc._id, customerIds);
    const change = _.omit(difference(customerIds.toString(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateCustomer(productId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.removeRelate
    };

    const result = await this.relateService.removeRelateCustomerMultiple(doc._id, customerIds);
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }
  //#endregion

  //#region add Relate Todo
  async addRelateTodos(productId: string, todoIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateTodoService.addRelateTodo(doc._id, todoIds);
    const change = _.omit(difference(todoIds.toString(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async updateRelateTodos(productId: string, todoIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateTodoService.updateRelateTodo(doc._id, todoIds);
    const change = _.omit(difference(todoIds.toString(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateTodos(productId: string, todoIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.removeRelate
    };

    const result = await this.relateTodoService.removeRelateTodoMultiple(doc._id, todoIds);
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }
  //#endregion

  // //#region add Relate Departments
  // async addRelateDepartments(productId: string, createRelateArrDepartmentDto: CreateRelateArrDepartmentDto, authUser: JwtUser) {
  //   const doc = await this.productModel.findById(productId)
  //     .byTenant(authUser.owner, authUser?.role == UserRole.Admin)
  //     .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
  //     .exec();

  //   const history = {
  //     product: doc._id,
  //     before: doc.toJSON(),
  //     updatedBy: authUser.userId,
  //     status: StatusHistory.addRelate
  //   };

  //   const result = this.relateDepartmentService.addRelateDepartment(doc, createRelateArrDepartmentDto, authUser);
  //   const change = _.omit(difference(createRelateArrDepartmentDto.department.toString(), history.before), ['updatedAt']);
  //   this.historyService.create({ ...history, change }, authUser);

  //   return result;
  // }

  // async updateRelateDepartments(productId: string, createRelateArrDepartmentDto: CreateRelateArrDepartmentDto, authUser: JwtUser) {
  //   const doc = await this.productModel.findById(productId)
  //     .byTenant(authUser.owner, authUser?.role == UserRole.Admin)
  //     .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
  //     .exec();

  //   const history = {
  //     product: doc._id,
  //     before: doc.toJSON(),
  //     updatedBy: authUser.userId,
  //     status: StatusHistory.addRelate
  //   };

  //   const result = this.relateDepartmentService.updateRelateDepartment(doc, createRelateArrDepartmentDto, authUser);
  //   const change = _.omit(difference(createRelateArrDepartmentDto.department.toString(), history.before), ['updatedAt']);
  //   this.historyService.create({ ...history, change }, authUser);

  //   return result;
  // }

  // async removeRelateDepartments(productId: string, departmentIds: string[], authUser: JwtUser) {
  //   const doc = await this.productModel.findById(productId)
  //     .byTenant(authUser.owner, authUser?.role == UserRole.Admin)
  //     .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
  //     .exec();

  //   const history = {
  //     product: doc._id,
  //     before: doc.toJSON(),
  //     updatedBy: authUser.userId,
  //     status: StatusHistory.removeRelate
  //   };

  //   const result = await this.relateDepartmentService.removeRelateDepartmentMultiple(doc, departmentIds);
  //   const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
  //   this.historyService.create({ ...history, change }, authUser);

  //   return result;
  // }
  // //#endregion

    //#region add Relate Departments
  async addRelateColors(productId: string, createRelateArrColorDto: CreateRelateArrColorDto, authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner, authUser?.role == UserRole.Admin)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateColorService.addRelateColor(doc, createRelateArrColorDto, authUser);
    const change = _.omit(difference(createRelateArrColorDto.colors, history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async updateRelateColors(productId: string, createRelateArrColorDto: CreateRelateArrColorDto, authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner, authUser?.role == UserRole.Admin)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    const result = this.relateColorService.updateRelateColor(doc, createRelateArrColorDto, authUser);
    const change = _.omit(difference(createRelateArrColorDto.colors, history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateColors(productId: string, departmentIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner, authUser?.role == UserRole.Admin)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.removeRelate
    };

    const result = await this.relateColorService.removeRelateColorMultiple(doc, departmentIds);
    const change = _.omit(difference(doc.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }
  //#endregion

  //#region add Relate Owners
  async addRelateOwners(productId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .select('relateOwners')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    doc.relateOwners.addToSet(...customerIds);

    const result = await doc.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async updateRelateOwners(productId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .select('relateOwners')
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.addRelate
    };

    doc.relateOwners.pull(...doc.relateOwners);
    doc.relateOwners.addToSet(...customerIds);

    const result = await doc.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);
    this.historyService.create({ ...history, change }, authUser);

    return result;
  }

  async removeRelateOwners(productId: string, customerIds: string[], authUser: JwtUser) {
    const doc = await this.productModel.findById(productId)
      .byTenant(authUser.owner)
      .select('relateOwners')
      .orFail(new NotFoundException(ErrCode.E_TODO_NOT_FOUND))
      .exec();

    const history = {
      product: doc._id,
      before: doc.toJSON(),
      updatedBy: authUser.userId,
      status: StatusHistory.removeRelate
    };

    doc.relateOwners.pull(...customerIds);

    const result = await doc.save();
    const change = _.omit(difference(result.toJSON(), history.before), ['updatedAt']);

    this.historyService.create({ ...history, change }, authUser);

    return result;
  }
  //#endregion

  /**
   * update images
   * @param id 
   * @param fileId 
   * @param userReq 
   */
  async updateImage(id: string, fileId: string, userReq: JwtUser, info: FileBodyDto) {
    const customer = await this.productModel.findById(id)
      .byTenant(userReq.owner)
      .select('imageList')
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_NOT_FOUND))
      .exec();

    const fileObj = customer.imageList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_CUSTOMER_FILE_NOT_FOUND);
    }

    const history = {
      product: customer._id,
      before: customer.toJSON(),
      updatedBy: userReq.userId,
      status: StatusHistory.update
    }

    fileObj.name = info.name;
    fileObj.description = info.description;

    const result = await customer.save();

    const change = { imageList: result.toJSON().imageList };

    this.historyService.create({ ...history, change }, userReq);

    return result;
  }

  async report(userReq: JwtUser, report: Report) {
    let filter: FilterQuery<ProductDocument> = {};

    if (report.year) {
      filter.createdAt = { $gte: report.year };
      filter.createdAt = { $lte: report.year };
    }

    const cmd = this.productModel.find({ ...filter })
      .byTenant(userReq.owner)
      .lean({ autopopulate: true });

    // if (query.toDate) {
    //   filter.startDate = { ...filter.startDate, $lte: query.toDate };
    //   filter.dueDate = { ...filter.dueDate, $lte: query.toDate };
    // }
    //.where('createdAt').in([report.year])

    return cmd.exec();
  }

  private addNotification(product: ProductDocument, userReq: JwtUser) {
    var urlImage = product.imageList.length > 0 ? product.imageList?.[0].url : "";
    var notify = {
      title: product.name,
      description: product.description,
      type: NotificationType.product,
      author: userReq.userId,
      image: urlImage,
      isRead: false,
      object: { id: product.id, name: product.name, discription: product.description, isHot: product.isHot },
      owner: userReq.owner
    };

    this.notificationService.create({ ...notify }, userReq);
  }
}
