import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { PRODUCT_CTG, PRODUCT_TYPES } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { deleteFile, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { CreateProductTypesDto } from './dto/create-product-types.dto';
import { UpdateProductTypesDto } from './dto/update-product-types.dto';
import { ProductTypesDocument } from './entities/product-types.entity';
import { UserRole, StaffRole, LevelAccount } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { UsersService } from 'src/users/users.service';
import { LEVEL_ACCOUNT } from 'src/commons/constants/envConstanst';

@Injectable()
export class ProductTypesService {
  /**
   *
   */
  constructor(
    @InjectModel(PRODUCT_TYPES) private productTypesModel: Model<ProductTypesDocument>,
    private usersService: UsersService,
  ) { }
  create(createProductTypesDto: CreateProductTypesDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);
    return new this.productTypesModel(createProductTypesDto)
      .withTenant(authUser.owner)
      .save();
  }

  async findAll(authUser: JwtUser, query?: Paginate & { search?: string, isOwner: boolean }) {
    const filter: FilterQuery<ProductTypesDocument> = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    const cmd = this.productTypesModel.find(filter)
      .byTenant(authUser.owner, new String(query?.isOwner) == 'false') 
      .lean()
    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }
    const totalCmd = this.productTypesModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { data, total };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.productTypesModel.findById(id)
      //.byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_CTG_NOT_FOUND))
      .populateTenant('username')
      .lean()
      .exec();
  }

  update(id: string, updateProductTypesDto: UpdateProductTypesDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);

    return this.productTypesModel.findByIdAndUpdate(id, updateProductTypesDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_CTG_NOT_FOUND))
      .exec()
  }

  async remove(id: string, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);

    const doc = await this.productTypesModel.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_CTG_NOT_FOUND))
      .exec()

    return doc;
  }

  // async uploadIcon(id: string, file: Express.Multer.File, authUser: JwtUser) {
  //   const sizeFile = await this.usersService.getSizeFileOwner(authUser);
  //   if(sizeFile > LEVEL_ACCOUNT[authUser.levelAccount|| LevelAccount.FREE].SIZE_FILE){
  //     throw new BadRequestException(ErrCode.E_OUT_OF_MEMORY);
  //   } 
  //   const doc = await this.productTypesModel.findById(id)
  //     .byTenant(authUser.owner)
  //     .orFail(new NotFoundException(ErrCode.E_PRODUCT_CTG_NOT_FOUND))
  //     .exec();

  //   const random = nanoid(16);
  //   const url = `product-ctgs/icons/${authUser.owner ?? 'default'}/${id}/${random}.png`;
  //   await uploadFile({
  //     file: file,
  //     filePath: url,
  //     mimetype: file.mimetype
  //   })

  //   let size = file.size;
  //   if (doc.icon) {
  //     const res = await deleteFile(doc.icon)
  //     size = size - res.size;
  //   }
  //   this.usersService.updateSizeFileOwner(authUser, size);

  //   doc.icon = url;
  //   return doc.save();
  // }

  // async getIcon(owner: string, ctgId: string, fileName: string) {
  //   const key = `product-ctgs/icons/${owner}/${ctgId}/${fileName}`;
  //   return await signedUrl(key);
  // }
}
