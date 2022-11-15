import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { PRODUCT_RELATE_DEPARTMENT } from 'src/commons/constants/schemaConst';
import { CreateRelateArrProductDto } from 'src/departments/dto/create-relate-product.dto';
import { DepartmentDocument } from 'src/departments/entities/department.entity';
import { UserRole } from 'src/users/interface/userRoles';
import { ProductRelateDepartmentDoc } from '../entities/product-ralate-department.entity';
import { Product, ProductDocument } from '../entities/product.entity';
import { CreateProductRelateDepartmentDto } from './dto/create-product-rel-department.dto';
import { CreateRelateArrDepartmentDto } from './dto/create-product-rle-arrDepartment.dto';

@Injectable()
export class RelateDepartmentService {
    constructor(
        @InjectModel(PRODUCT_RELATE_DEPARTMENT) private model: Model<ProductRelateDepartmentDoc>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>
    ) { }

    async create(dto: CreateProductRelateDepartmentDto) {
        const exists = await this.model.findOne(dto).lean().exec();
        if (exists) {
            exists.quantity += dto.quantity;
            return this.model.findByIdAndUpdate(exists._id, exists).exec();
        }
        return new this.model(dto)
            .save()
    }

    async delete(ids: string[]) {
        return await this.model.deleteMany({ _id: { $in: ids } })
            .exec();
    }

    remove(productId: string, customerId: string) {
        return this.model.findOneAndDelete({ product: productId, customer: customerId })
            .exec();
    }

    //#region Product Relate Department
    async addRelateDepartment(doc: ProductDocument,createRelateArrDepartmentDto: CreateRelateArrDepartmentDto, authUser: JwtUser) {
        let result = [];
        let productDepartment = await this.model.findOne({ department: authUser?.department, product: doc._id }).lean().exec();
        console.log(createRelateArrDepartmentDto)
        console.log(doc)
        if (createRelateArrDepartmentDto.department ) {
            createRelateArrDepartmentDto.department.forEach(async element => {
                var dto = new CreateProductRelateDepartmentDto();
                dto.department = element;
                dto.product = doc._id;
                

                const exists = await this.model.findOne(dto).lean().exec();
                dto.quantity = 0;
                
                if (authUser?.department && element != authUser?.department && productDepartment?.quantity > 0 && !createRelateArrDepartmentDto.wareHouse) {
                    console.log(false)
                    if (!exists) {
                        if (productDepartment?.quantity > createRelateArrDepartmentDto.quantity) {
                            dto.quantity += createRelateArrDepartmentDto.quantity;
                            productDepartment.quantity -= createRelateArrDepartmentDto.quantity
                        } else {
                            dto.quantity = productDepartment?.quantity;
                            productDepartment.quantity = 0
                        }
                        result.push(await new this.model(dto).save());
                    } else {
                        if (productDepartment.quantity > createRelateArrDepartmentDto.quantity) {
                            exists.quantity += createRelateArrDepartmentDto.quantity;
                            productDepartment.quantity -= createRelateArrDepartmentDto.quantity
                        } else {
                            exists.quantity = productDepartment.quantity;
                            productDepartment.quantity = 0
                        }
                        result.push(await this.model.findByIdAndUpdate(exists._id, exists).exec());
                    }
                    await this.model.findByIdAndUpdate(productDepartment._id, productDepartment).exec();
                }
                if (doc.quantity > 0 && createRelateArrDepartmentDto.wareHouse && authUser?.role == UserRole.Admin) {
                    if (!exists) {
                        console.log(doc?.quantity)
                        if (doc?.quantity > createRelateArrDepartmentDto.quantity) {
                            dto.quantity += createRelateArrDepartmentDto.quantity;
                            doc.quantity -= createRelateArrDepartmentDto.quantity
                        } else {
                            dto.quantity = doc?.quantity;
                            doc.quantity = 0
                        }
                        const relateDepartment = await new this.model(dto)
                        result.push(relateDepartment);
                        relateDepartment.save()
                    } else {
                        console.log(false)
                        if (doc.quantity > createRelateArrDepartmentDto.quantity) {
                            exists.quantity += createRelateArrDepartmentDto.quantity;
                            doc.quantity -= createRelateArrDepartmentDto.quantity
                        } else {
                            exists.quantity = doc.quantity;
                            doc.quantity = 0
                        }
                        await this.model.findByIdAndUpdate(exists._id, exists).exec()
                        result.push(exists);
                    }
                    await this.productModel.findByIdAndUpdate(doc._id, doc).exec();
                }
            });
        }
        return result;
    }

    async updateRelateDepartment(doc: ProductDocument, createRelateArrDepartmentDto: CreateRelateArrDepartmentDto, authUser: JwtUser) {
        if (createRelateArrDepartmentDto.department) {
            //var result = this.model.deleteMany({ product: { $in: doc.id } })
            return this.addRelateDepartment(doc, createRelateArrDepartmentDto, authUser);
        }
    }

    async removeRelateDepartmentMultiple(doc: ProductDocument, departmentIds: string[]) {
        const result = await this.model.find({ product: doc?._id, department: { $in: departmentIds } })
            .exec();
        doc.quantity += result.reduce(
            (total, x) => total + x.quantity,
            0,
        );
        await this.productModel.findByIdAndUpdate(doc._id, doc).exec();
        return this.model.deleteMany({ product: doc?._id, department: { $in: departmentIds } })
            .exec();
    }
    //#endregion

    //#region Department Relate Product
    async addRelateProduct(doc: DepartmentDocument, createRelateArrProductDto: CreateRelateArrProductDto , authUser: JwtUser) {
        let result = [];
        if (createRelateArrProductDto.products) {
            createRelateArrProductDto.products.forEach(async element => {
                var dto = new CreateProductRelateDepartmentDto();
                dto.department = doc._id;
                dto.product = element.productId;
                let productDepartment = await this.model.findOne({ department: authUser?.department, product: doc._id }).lean().exec();
                const exists = await this.model.findOne(dto).lean().exec();
                if(authUser?.department && doc._id != authUser?.department && productDepartment?.quantity > 0 && !createRelateArrProductDto.wareHouse){
                    if (!exists) {
                        if (productDepartment?.quantity > element.quantity) {
                            dto.quantity += element.quantity;
                            productDepartment.quantity -= element.quantity
                        } else {
                            dto.quantity = productDepartment?.quantity;
                            productDepartment.quantity = 0
                        }
                        const relateDepartment = await new this.model(dto)
                        result.push(relateDepartment);
                        relateDepartment.save()
                    } else {
                        if (productDepartment.quantity > element.quantity) {
                            exists.quantity += element.quantity;
                            productDepartment.quantity -= element.quantity
                        } else {
                            exists.quantity = productDepartment.quantity;
                            productDepartment.quantity = 0
                        }
                        await this.model.findByIdAndUpdate(exists._id, exists).exec()
                        result.push(exists);
                    }
                    await this.model.findByIdAndUpdate(productDepartment._id, productDepartment).exec();
                }
                const product = await this.productModel.findById(element.productId).exec()
                if (product.quantity > 0 && createRelateArrProductDto.wareHouse && authUser?.role == UserRole.Admin) {
                    if (!exists) {
                        if (product?.quantity > element.quantity) {
                            dto.quantity += element.quantity;
                            product.quantity -= element.quantity
                        } else {
                            dto.quantity = product?.quantity;
                            product.quantity = 0
                        }
                        const relateDepartment = await new this.model(dto)
                        result.push(relateDepartment);
                        relateDepartment.save()
                    } else {
                        console.log(false)
                        if (product.quantity > element.quantity) {
                            exists.quantity += element.quantity;
                            product.quantity -= element.quantity
                        } else {
                            exists.quantity = product.quantity;
                            product.quantity = 0
                        }
                        await this.model.findByIdAndUpdate(exists._id, exists).exec()
                        result.push(exists);
                    }
                    await this.productModel.findByIdAndUpdate(product._id, product).exec();
                }
            });
        }
        return result;
    }

    async updateRelateProduct(doc: DepartmentDocument, createRelateArrProductDto: CreateRelateArrProductDto, authUser: JwtUser) {
        if (createRelateArrProductDto) {
            //var result = this.model.deleteMany({ department: { $in: doc.id } })
              await  this.addRelateProduct(doc, createRelateArrProductDto, authUser);
        }
    }

    async removeRelateProductMultiple(departmentId: string, productIds: string[]) {
        // return this.model.deleteMany({ department: departmentId, product: { $in: productIds } })
        //     .exec();
        productIds?.forEach(async id => {
            const result = await this.model.find({ department: departmentId, product: id })
            .exec();
            if(result){
                const product = await this.productModel.findById(id).exec();
                product.quantity += result.quantity;
            }
        })
        return this.model.deleteMany({ department: departmentId, product: { $in: productIds } })
            .exec();
    }
    //#endregion
}
