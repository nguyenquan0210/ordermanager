import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { UserRole } from 'src/users/interface/userRoles';
import { Product, ProductDocument } from '../entities/product.entity';
import { PRODUCT_RELATE_COLOR } from 'src/commons/constants/schemaConst';
import { ProductRelateColorsDoc } from '../entities/products-ralate-color.entity';
import { CreateProductRelateColorDto } from './dto/create-product-rel-color.dto';
import { CreateRelateArrColorDto } from './dto/create-product-rle-arr-color.dto';


@Injectable()
export class RelateColorService {
    constructor(
        @InjectModel(PRODUCT_RELATE_COLOR) private model: Model<ProductRelateColorsDoc>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>
    ) { }

    async create(dto: CreateProductRelateColorDto) {
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

    //#region Product Relate Color
    // async addRelateColor(doc: ProductDocument,createRelateArrColorDto: CreateRelateArrColorDto, authUser: JwtUser) {
    //     let result = [];
    //     let productColor = await this.model.findOne({ Color: authUser?.Color, product: doc._id }).lean().exec();
    //     console.log(createRelateArrColorDto)
    //     console.log(doc)
    //     if (createRelateArrColorDto.Color ) {
    //         createRelateArrColorDto.Color.forEach(async element => {
    //             var dto = new CreateProductRelateColorDto();
    //             dto.Color = element;
    //             dto.product = doc._id;
                

    //             const exists = await this.model.findOne(dto).lean().exec();
    //             dto.quantity = 0;
                
    //             if (authUser?.Color && element != authUser?.Color && productColor?.quantity > 0 && !createRelateArrColorDto.wareHouse) {
    //                 console.log(false)
    //                 if (!exists) {
    //                     if (productColor?.quantity > createRelateArrColorDto.quantity) {
    //                         dto.quantity += createRelateArrColorDto.quantity;
    //                         productColor.quantity -= createRelateArrColorDto.quantity
    //                     } else {
    //                         dto.quantity = productColor?.quantity;
    //                         productColor.quantity = 0
    //                     }
    //                     result.push(await new this.model(dto).save());
    //                 } else {
    //                     if (productColor.quantity > createRelateArrColorDto.quantity) {
    //                         exists.quantity += createRelateArrColorDto.quantity;
    //                         productColor.quantity -= createRelateArrColorDto.quantity
    //                     } else {
    //                         exists.quantity = productColor.quantity;
    //                         productColor.quantity = 0
    //                     }
    //                     result.push(await this.model.findByIdAndUpdate(exists._id, exists).exec());
    //                 }
    //                 await this.model.findByIdAndUpdate(productColor._id, productColor).exec();
    //             }
    //             if (doc.quantity > 0 && createRelateArrColorDto.wareHouse && authUser?.role == UserRole.Admin) {
    //                 if (!exists) {
    //                     console.log(doc?.quantity)
    //                     if (doc?.quantity > createRelateArrColorDto.quantity) {
    //                         dto.quantity += createRelateArrColorDto.quantity;
    //                         doc.quantity -= createRelateArrColorDto.quantity
    //                     } else {
    //                         dto.quantity = doc?.quantity;
    //                         doc.quantity = 0
    //                     }
    //                     const relateColor = await new this.model(dto)
    //                     result.push(relateColor);
    //                     relateColor.save()
    //                 } else {
    //                     console.log(false)
    //                     if (doc.quantity > createRelateArrColorDto.quantity) {
    //                         exists.quantity += createRelateArrColorDto.quantity;
    //                         doc.quantity -= createRelateArrColorDto.quantity
    //                     } else {
    //                         exists.quantity = doc.quantity;
    //                         doc.quantity = 0
    //                     }
    //                     await this.model.findByIdAndUpdate(exists._id, exists).exec()
    //                     result.push(exists);
    //                 }
    //                 await this.productModel.findByIdAndUpdate(doc._id, doc).exec();
    //             }
    //         });
    //     }
    //     return result;
    // }

    // async updateRelateColor(doc: ProductDocument, createRelateArrColorDto: CreateRelateArrColorDto, authUser: JwtUser) {
    //     if (createRelateArrColorDto.Color) {
    //         //var result = this.model.deleteMany({ product: { $in: doc.id } })
    //         return this.addRelateColor(doc, createRelateArrColorDto, authUser);
    //     }
    // }

    // async removeRelateColorMultiple(doc: ProductDocument, ColorIds: string[]) {
    //     const result = await this.model.find({ product: doc?._id, Color: { $in: ColorIds } })
    //         .exec();
    //     doc.quantity += result.reduce(
    //         (total, x) => total + x.quantity,
    //         0,
    //     );
    //     await this.productModel.findByIdAndUpdate(doc._id, doc).exec();
    //     return this.model.deleteMany({ product: doc?._id, Color: { $in: ColorIds } })
    //         .exec();
    // }
    //#endregion

    //#region Color Relate Product
    async addRelateColor(doc: ProductDocument, createRelateArrProductDto: CreateRelateArrColorDto, isOrder: Boolean , authUser: JwtUser) {
        let result = [];
        // console.log(createRelateArrProductDto)
        // return
        let totalMoney = 0;
        if (createRelateArrProductDto.colors) {
            
            for (const key in createRelateArrProductDto.colors) {
                var dto = new CreateProductRelateColorDto();
                dto.product = doc._id;
                dto.color = createRelateArrProductDto.colors[key].color;
                const exists = await this.model.findOne(dto).lean().exec();
                totalMoney += createRelateArrProductDto.colors[key].money;
                if (!exists) {
                    dto.quantity = createRelateArrProductDto.colors[key].quantity;
                    dto.money = createRelateArrProductDto.colors[key].money;
                    const relateColor = await new this.model(dto)
                    result.push(relateColor);
                    relateColor.save()
                } else {
                    if(isOrder){
                        exists.quantity -= createRelateArrProductDto.colors[key].quantity;
                    }else{
                        exists.quantity += createRelateArrProductDto.colors[key].quantity;
                    }
                    exists.money = createRelateArrProductDto.colors[key].money;
                    await this.model.findByIdAndUpdate(exists._id, exists).exec()
                    result.push(exists);
                }
            }
        }
        return { result, totalMoney } ;
    }

    async updateRelateColor(doc: ProductDocument, createRelateArrProductDto: CreateRelateArrColorDto, authUser: JwtUser) {
        if (createRelateArrProductDto) {
            //var result = this.model.deleteMany({ Color: { $in: doc.id } })
              await  this.addRelateColor(doc, createRelateArrProductDto, true, authUser);
        }
    }

    async removeRelateColorMultiple(product: ProductDocument, colorId: string[]) {
        // return this.model.deleteMany({ Color: ColorId, product: { $in: productIds } })
        //     .exec();
        colorId?.forEach(async id => {
            const result = await this.model.findOne({ product: product?.['_id'], color: id })
            .exec();
            if(result){
                const product = await this.productModel.findById(id).exec();
                product.quantity += result?.quantity;
            }
        })
        return this.model.deleteMany({ product: product?.['_id'], color: { $in: colorId } })
            .exec();
    }
    //#endregion
}
