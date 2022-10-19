import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { RESOURCE_CTG } from 'src/commons/constants/schemaConst';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDocument } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(RESOURCE_CTG) private model: Model<CategoryDocument>
  ) { }
  create(createCategoryDto: CreateCategoryDto, authUser: JwtUser) {
    return new this.model(createCategoryDto)
      .withTenant(authUser.owner)
      .save();
  }

  async findAll(authUser: JwtUser) {
    const data = await this.model.find({})
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .exec();
    return { total: data.length, data }
  }

  findOne(id: string, authUser: JwtUser) {
    return this.model.findById(id)
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_CTG_NOT_FOUND))
      .exec()
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto, authUser: JwtUser) {
    return this.model.findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_CTG_NOT_FOUND))
      .exec();
  }

  remove(id: string, authUser: JwtUser) {
    return this.model.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_CTG_NOT_FOUND))
      .exec();
  }
}
