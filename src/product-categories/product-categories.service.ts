import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { PRODUCT_CTG } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { deleteFile, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoryDocument } from './entities/product-category.entity';
import { UserRole, StaffRole, LevelAccount } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { UsersService } from 'src/users/users.service';
import { LEVEL_ACCOUNT } from 'src/commons/constants/envConstanst';

@Injectable()
export class ProductCategoriesService {
  /**
   *
   */
  constructor(
    @InjectModel(PRODUCT_CTG) private productCtgModel: Model<ProductCategoryDocument>,
    private usersService: UsersService,
  ) { }
  create(createProductCategoryDto: CreateProductCategoryDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);
    return new this.productCtgModel(createProductCategoryDto)
      .withTenant(authUser.owner)
      .save();
  }

  async findAll(authUser: JwtUser, query?: Paginate & { search?: string, isOwner: boolean }) {
    const filter: FilterQuery<ProductCategoryDocument> = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    const cmd = this.productCtgModel.find(filter)
      .byTenant(authUser.owner, new String(query?.isOwner) == 'false') 
      .lean()
    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }
    const totalCmd = this.productCtgModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { data, total };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.productCtgModel.findById(id)
      //.byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_CTG_NOT_FOUND))
      .populateTenant('username')
      .lean()
      .exec();
  }

  update(id: string, updateProductCategoryDto: UpdateProductCategoryDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);

    return this.productCtgModel.findByIdAndUpdate(id, updateProductCategoryDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_CTG_NOT_FOUND))
      .exec()
  }

  async remove(id: string, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);

    const doc = await this.productCtgModel.findByIdAndDelete(id)
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
  //   const doc = await this.productCtgModel.findById(id)
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
