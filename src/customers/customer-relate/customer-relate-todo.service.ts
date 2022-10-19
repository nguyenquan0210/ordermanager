import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CUSTOMER_RELATE_TODO } from 'src/commons/constants/schemaConst';
import { TodoDocument } from 'src/todos/entities/todo.entity';
import { CustomerRelateTodo } from '../entities/customer-relate-todo.entity';
import { CustomerDocument } from '../entities/customer.entity';
import { CreateCustomerRelateTodoDto } from './dto/create-customer-rel-todo.dto';
// import mongoose from 'mongoose';

@Injectable()
export class CustomerRelateTodoService {
  constructor(
    @InjectModel(CUSTOMER_RELATE_TODO) private model: Model<CustomerRelateTodo>
  ) { }
  
  async create(dto: CreateCustomerRelateTodoDto) {
    const exists = await this.model.findOne(dto).lean().exec();
    if (exists) {
      return exists;
    }
    return new this.model(dto)
      .save()
  }

  async createAsync(doc: CustomerDocument, todoIds: string[]) {
    if(todoIds){
      todoIds.forEach(async element => {
          var dto = new CreateCustomerRelateTodoDto();
          dto.customer = doc._id;
          dto.todo = element;

          const exists = await this.model.findOne(dto).lean().exec();
          if (!exists) {
            await new this.model(dto).save();
          }
      });
    }
  }

  async findTodoOfCustomer(customerId: string) {
    if(!mongoose.Types.ObjectId.isValid(customerId)){
      throw new BadRequestException('customerId must be a mongodb id')
    }
    const doc = await this.model.find()
      .where('customer', customerId)
      .lean()
      .exec();
    let listIdTodo = []
    if(doc?.length > 0){
      for (let index = 0; index < doc.length; index++) {
        listIdTodo =[...listIdTodo, mongoose.Types.ObjectId(doc[index].todo.toString())]
      }
    }
    return listIdTodo;
  }

  async updateRelateTodo(doc: CustomerDocument, todoIds: string[]) {
    if(todoIds){
        var result = this.model.deleteMany({customer: {$in: doc.id}})
        if ((await result).ok == 1) {
          this.createAsync(doc, todoIds);
        }
    }
  }

  async delete(ids: string[]) {
    return await this.model.deleteMany({ _id: { $in: ids } })
      .exec();
  }

  remove(customerId: string, todoIds: string[]) {
    return this.model.deleteMany({ customer: customerId, todo: { $in: todoIds } })
      .exec();
  }

  //#region Todo Relate Customer
  async addTodoRelateCustomer(doc: TodoDocument, customerIds: string[]) {
    if(customerIds){
      customerIds.forEach(async element => {
          var dto = new CreateCustomerRelateTodoDto();
          dto.todo = doc._id;
          dto.customer = element;

          const exists = await this.model.findOne(dto).lean().exec();
          if (!exists) {
            await new this.model(dto).save();
          }
      });
    }
  }
  
  async updateRelateCustomer(doc: TodoDocument, customerIds: string[]) {
    if(customerIds){
        var result = this.model.deleteMany({todo: {$in: doc.id}})
        if ((await result).ok == 1) {
          this.addTodoRelateCustomer(doc, customerIds);
        }
    }
  }

  removeTodoRelateCustomerMultiple(todoId: string, customerIds: string[]) {
    return this.model.deleteMany({ todo: todoId, customer: { $in: customerIds } })
      .exec();
  }
  //#endregion
}
