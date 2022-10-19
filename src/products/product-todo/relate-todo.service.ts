import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PRODUCT_RELATE_TODO } from 'src/commons/constants/schemaConst';
import { TodoDocument } from 'src/todos/entities/todo.entity';
import { ProductRelateCustomerDoc } from '../entities/product-relate-customer.entity';
import { ProductDocument } from '../entities/product.entity';
import { CreateProductRelateTodoDto } from './dto/create-product-rel-todo.dto';

@Injectable()
export class RelateTodoService {
  constructor(
    @InjectModel(PRODUCT_RELATE_TODO) private model: Model<ProductRelateCustomerDoc>
  ) { }
  
  async create(dto: CreateProductRelateTodoDto) {
    const exists = await this.model.findOne(dto).lean().exec();
    if (exists) {
      return exists;
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

  //#region Product Relate Todo
  async addRelateTodo(doc: ProductDocument, todoIds: string[]) {
    if(todoIds){
        todoIds.forEach(async element => {
          var dto = new CreateProductRelateTodoDto();
          dto.todo = element;
          dto.product = doc._id;

          const exists = await this.model.findOne(dto).lean().exec();
          if (!exists) {
            await new this.model(dto).save();
          }
      });
    }
  }
  
  async updateRelateTodo(doc: ProductDocument, todoIds: string[]) {
    if(todoIds){
        var result = this.model.deleteMany({product: {$in: doc.id}})
        if ((await result).ok == 1) {
          this.addRelateTodo(doc, todoIds);
        }
    }
  }

  removeRelateTodoMultiple(productId: string, todoIds: string[]) {
    return this.model.deleteMany({ product: productId, todo: { $in: todoIds } })
      .exec();
  }
  //#endregion
  
  //#region Customer Relate Product
  async addRelateProduct(doc: TodoDocument, productIds: string[]) {
    if(productIds){
        productIds.forEach(async element => {
          var dto = new CreateProductRelateTodoDto();
          dto.todo = doc._id;
          dto.product = element;

          const exists = await this.model.findOne(dto).lean().exec();
          if (!exists) {
            await new this.model(dto).save();
          }
      });
    }
  }

  async updateRelateProduct(doc: TodoDocument, productIds: string[]) {
    if(productIds){
        var result = this.model.deleteMany({todo: {$in: doc.id}})
        if ((await result).ok == 1) {
          this.addRelateProduct(doc, productIds);
        }        
    }
  }
  
  removeRelateProductMultiple(todoId: string, productIds: string[]) {
    return this.model.deleteMany({ todo: todoId, product: { $in: productIds } })
      .exec();
  }
  //#endregion
}
