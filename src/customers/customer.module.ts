import { RelateCustomerService } from 'src/products/product-customer/relate-customer.service';
import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Customer, CustomerSchema } from './entities/customer.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { AttributesModule } from 'src/attributes/attributes.module';
import { CustomerLabelService } from './customer-label/customer-label.service';
import {
  CUSTOMER_LABEL, CUSTOMER_DEMAND_GROUP, CUSTOMER_RELATE_TODO, CUSTOMER_HISTORY, PROVINCE,
  PRODUCT_RELATE_CUSTOMER, CUSTOMER_RELATE_STAFF, TODO_DEMAND, CUSTOMER_NOTE, CUSTOMER_RELATE_CUSTOMER
} from 'src/commons/constants/schemaConst';
import { LabelSchema } from 'src/labels/entities/label.entity';
import { LabelsController } from './customer-labels.controller';
import { CustomerDemandGroupsSchema } from './entities/customer-demandGroup.entity';
import { CustomerDemandGroupsService } from './customer-demandGroup/customer-demandGroup.service';
import { CustomerDemandGroupsController } from './customer-demandGroups.controller';
import { CustomerRelateTodoSchema } from './entities/customer-relate-todo.entity';
import { CustomerRelateController } from './customer-relate/customer-relate.controller';
import { CustomerRelateTodoService } from './customer-relate/customer-relate-todo.service';
import { CustomerHistorySchema } from './entities/customer-history.entity';
import { CustomerHistoriesController } from './customer-history/customer-histories.controller';
import { CustomerHistoriesService } from './customer-history/customer-histories.service';
import { ProductRelateCustomerSchema } from 'src/products/entities/product-relate-customer.entity';
import { CustomerRelateStaffService } from './customer-relate/customer-relate-staff.service';
import { CustomerRelateStaffSchema } from './entities/customer-relate-staff.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Todo, TodoSchema } from 'src/todos/entities/todo.entity';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { TodoDemandSchema } from 'src/todos/entities/todo-demand.entity';
import { TodoDemandService } from 'src/todos/todo-demand/todo-demand.service';
import { TodoDemandController } from 'src/todos/todo-demand.controllder';
import { CustomerNoteSchema } from './entities/customer-note.entity';
import { CustomerNoteService } from './customer-note/customer-note.service';
import { CustomerNoteController } from './customer-note.controller';
import { Notifications, NotificationsSchema } from 'src/notifications/entities/notification.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CustomerRelateCustomerController } from './customer-relate-customer/customer-relate-customer.controller';
import { CustomerRelateCustomerService } from './customer-relate-customer/customer-relate-customer.service';
import { CustomerCustomerSchema } from './customer-relate-customer/entities/customer-relate-customer.entity';
import { CustomerProvinceSchema } from './customer-province/entities/customer-province.entity';
import { CustomerProvinceController } from './customer-province/customer-province.controller';
import { CustomerProvinceService } from './customer-province/customer-province.service';
import { UsersModule } from 'src/users/users.module';
import { ResourcesModule } from 'src/resources/resources.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([{
      name: Customer.name,
      useFactory: () => {
        const schema = CustomerSchema;
        schema.plugin(TenantPlugin.addPlugin);
        return schema;
      }
    },
    { name: Product.name, useFactory: () => ProductSchema },
    { name: Todo.name, useFactory: () => TodoSchema },
    { name: User.name, useFactory: () => UserSchema },
    { name: CUSTOMER_LABEL, useFactory: () => LabelSchema },
    { name: PRODUCT_RELATE_CUSTOMER, useFactory: () => ProductRelateCustomerSchema },
    { name: CUSTOMER_RELATE_TODO, useFactory: () => CustomerRelateTodoSchema },
    { name: CUSTOMER_RELATE_STAFF, useFactory: () => CustomerRelateStaffSchema },
    { name: PROVINCE, useFactory: () => CustomerProvinceSchema },
    { name: Notifications.name, useFactory: () => NotificationsSchema },      
    {
      name: CUSTOMER_DEMAND_GROUP, useFactory: () => {
        return CustomerDemandGroupsSchema.plugin(TenantPlugin.addPlugin);
      }
    },
    {
      name: CUSTOMER_HISTORY, useFactory: () => {
        return CustomerHistorySchema.plugin(TenantPlugin.addPlugin);
      }
    },
    {
      name: TODO_DEMAND, useFactory: () => {
        return TodoDemandSchema.plugin(TenantPlugin.addPlugin);
      }
    },
    { name: CUSTOMER_NOTE, useFactory: () => CustomerNoteSchema },
    {
      name: CUSTOMER_RELATE_CUSTOMER,
      useFactory: () => CustomerCustomerSchema
    },

    ]),
    AttributesModule.forRoot(),
    NotificationsModule,
    UsersModule,
    ResourcesModule
  ],
  controllers:
    [
      LabelsController,
      CustomerNoteController,
      CustomerController,
      CustomerDemandGroupsController,
      CustomerRelateController,
      CustomerHistoriesController,
      TodoDemandController,
      CustomerRelateCustomerController,
      CustomerProvinceController,
    ],
  providers:
    [
      CustomerService, CustomerLabelService,
      CustomerDemandGroupsService,
      CustomerRelateTodoService,
      CustomerHistoriesService,
      RelateCustomerService,
      CustomerRelateStaffService,
      TodoDemandService,
      CustomerNoteService,
      CustomerRelateCustomerService,
      CustomerProvinceService,
    ]
})

export class CustomerModule { }
