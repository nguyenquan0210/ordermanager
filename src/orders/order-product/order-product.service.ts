import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { ORDER_PRODUCT } from 'src/commons/constants/schemaConst';
import { OrderProductDto } from '../dto/create-order.dto';
import { OrderProductDocument, OrderProduct } from '../entities/order-product.entity';
@Injectable()
export class OrderProductService {

    constructor(
        @InjectModel(ORDER_PRODUCT) private modelOrderProduct: Model<OrderProductDocument>,
    ) {
    }
    create(orderProductDto: OrderProduct, authUser: JwtUser) {
        const doc = new this.modelOrderProduct(orderProductDto)
            .withTenant(authUser.owner);
        return doc.save();
    }
    async update(orderProductDto: OrderProduct, authUser: JwtUser) {
        const doc = new this.modelOrderProduct(orderProductDto)
            .withTenant(authUser.owner);
        return doc.save();
    }

    async updateIsDone(idOrder: string, authUser: JwtUser) {
        const cmd = await this.modelOrderProduct.updateMany({order: idOrder}, { $set: { isDone: true } })
            .byTenant(authUser.owner).exec();
    return { total: cmd.nModified, data: cmd };
    }

    async findAllOrderProduct(idProduct: string, authUser: JwtUser){

        const doc = await this.modelOrderProduct.find({ product: idProduct })
        .byTenant(authUser.owner)
        .where('isDone', false)
        .exec();
        let data = []

        if(doc && doc.length > 0){
            data = doc.map((item)=>{
                return item.order
            })
        }
        return data
    }

    async findOne(idProduct: string, idOrder: string){
        const cmd = await this.modelOrderProduct.findOne()
            .where('product', idProduct)
            .where('order', idOrder)
            .exec()
        return cmd 
    }

    async remove(id: string, idProduct: string) {
        const doc = await this.findOne(idProduct, id);
        return await this.modelOrderProduct.findByIdAndDelete(doc._id).exec();
    }

    async delete(id: string) {
        return await this.modelOrderProduct.deleteMany({ order: id}).exec();
    }
}
