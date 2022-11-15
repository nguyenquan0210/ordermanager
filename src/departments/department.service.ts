import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { deleteManyFiles, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { nanoid } from 'nanoid';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting } from 'src/commons/dto/sorting';
import { Department, DepartmentDocument } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { StaffRole, UserRole } from 'src/users/interface/userRoles';
import { CHECK_SIZE_FILE } from 'src/commons/constants/envConstanst';
import { QueryDepartment } from './dto/query-department.dto';
import { API_KEY_CURRENCY } from 'src/commons/constants/envConstanst';
import fetch from 'node-fetch';
import { Currency, ListCurrency } from './interface/currencies';
import { difference } from 'src/commons/utils/difference';
import { RelateDepartmentService } from 'src/products/product-department/relate-department.service';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { CreateRelateArrProductDto } from './dto/create-relate-product.dto';

@Injectable()
export class DepartmentsService {

    constructor(
        @InjectModel(Department.name) private model: Model<DepartmentDocument>,
        private readonly relateDepartmentService: RelateDepartmentService,

    ) {
    }
    async createDepartment(createDepartmentDto: CreateDepartmentDto, authUser: JwtUser) {
        const department = await this.model.findOne(createDepartmentDto)
        .byTenant(authUser.owner,false)
        .exec();
        if(!department){
            return new this.model(createDepartmentDto).withTenant(createDepartmentDto.userId|| authUser?.owner).save();
        }
        return this.model.findByIdAndUpdate(department._id, department).exec();
    }

    async currency(currency?: Currency, money?: number) {
        const url = `https://api.fastforex.io/fetch-all?from=${currency}&api_key=${API_KEY_CURRENCY}`
        const response = await fetch(url);
        const data = await response.json();
        const currencies = ListCurrency;
        const result = [];
        if(!data.error){
            currencies.forEach(currs => {
                const  opposite = 1/data.results?.[currs.name.toString()];
                const currecy = {
                    name : currs.name,
                    opposite: opposite,
                    rate: data.results?.[currs.name.toString()],
                    money: money/opposite 
                }
                result.push(currecy)
            })
        }
        return {base:currency,money, length:result.length, data:result};
    }

    async findAll(userReq: JwtUser, query?: Paginate & QueryDepartment & Sorting) {
        let filter: FilterQuery<DepartmentDocument> = {};

        if (query.search) {
            filter.$text = { $search: `.*${query.search}.*`, $language: "en" };
        }

        const cmd = this.model.find({ ...filter })
            .lean({ autopopulate: true })

        if (query.isOwner) {
            cmd.where('owner', userReq.owner);
        }
        if (query.isDeleted) {
            cmd.where('status', query.isDeleted);
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

        const totalCmd = this.model.countDocuments(cmd.getQuery());
        const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

        return { total, data };
    }

    async findOne(id: string, userReq: JwtUser) {
        var result = this.model.findById(id);
        if (userReq.role != UserRole.Admin) {
            result.byTenant(userReq.owner);
        }
        return result.orFail(new NotFoundException(ErrCode.E_Department_NOT_FOUND)).exec();
    }

    async getDepartment(idOwner: string, check?: Boolean) {
        const cmd = this.model.findOne().byTenant(idOwner)
        if (check) {
          cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
        }
        const result = await cmd.exec()
        
        return result?._id;
      }

    async isDeletedConfirmation(id: string, userReq: JwtUser) {
        const doc = await this.model.findById(id)
        .byTenant(userReq.owner, userReq.role != UserRole.Admin?true:false)
        .orFail(new NotFoundException(ErrCode.E_Department_NOT_FOUND))
        .exec();
        return await doc.set({ isDeleted: doc.isDeleted ?false :true }).save();
    }

    async remove(id: string, userReq: JwtUser) {
        return await this.model.findByIdAndDelete(id).where('isDeleted', true)
            .orFail(new NotFoundException(ErrCode.E_Department_NOT_FOUND))
            .exec();
    }

    getSignedUrl(id: string, owner: string, fileName: string) {
        const key = `Department/${owner}/${id}/${fileName}`;
        return signedUrl(key);
    }

    //#region Relate product in todo
  async addRelateProducts(todoId: string, createRelateArrProductDto: CreateRelateArrProductDto, authUser: JwtUser) {
    const doc = await this.model.findById(todoId)
      .byTenant(authUser.owner, CheckRoleStaff(authUser, StaffRole.Product)?true: authUser?.role == UserRole.Admin? true: false )
      .orFail(new NotFoundException(ErrCode.E_DEPARTMENT_NOT_FOUND))
      .exec();

    const result = this.relateDepartmentService.addRelateProduct(doc._id, createRelateArrProductDto, authUser);

    return result;
  }

  async removeRelateProducts(todoId: string, productIds: string[], authUser: JwtUser) {
    const doc = await this.model.findById(todoId)
      .byTenant(authUser.owner, CheckRoleStaff(authUser, StaffRole.Product)?true:false)
      .orFail(new NotFoundException(ErrCode.E_DEPARTMENT_NOT_FOUND))
      .exec();

    const result = await this.relateDepartmentService.removeRelateProductMultiple(doc._id, productIds);

    return result;
  }

  //#endregion
}

