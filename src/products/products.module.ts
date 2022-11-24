import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { AttributesModule } from 'src/attributes/attributes.module';
import { ProductCategorySchema } from 'src/product-categories/entities/product-category.entity';
import {
  PRODUCT_CTG, PRODUCT_STATUS, PRODUCT_LABEL, PRODUCT_HISTORY, PRODUCT_RELATE_CUSTOMER, PRODUCT_RELATE_TODO, PRODUCT_RELATE_DEPARTMENT
} from 'src/commons/constants/schemaConst';
import { ProductStatusSchema } from 'src/product-status/entities/product-status.entity';
import { LabelSchema } from 'src/labels/entities/label.entity';
import { LabelsController } from './product-labels.controller';
import { ProductLabelService } from './product-label/product-label.service';
import { HistoriesController } from './histories/histories.controller';
import { HistoriesService } from './histories/histories.service';
import { ProductHistorySchema } from './entities/product-history.entity';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { ProductRelateCustomerSchema } from './entities/product-relate-customer.entity';
import { RelateCustomerController } from './product-customer/relate-customer.controller';
import { RelateCustomerService } from './product-customer/relate-customer.service';
import { ProductRelateTodoCustomerSchema } from './entities/product-relate-todo.entity';
import { RelateTodoService } from './product-todo/relate-todo.service';
import { Customer, CustomerSchema } from 'src/customers/entities/customer.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Notifications, NotificationsSchema } from 'src/notifications/entities/notification.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { OrderProductSchema } from 'src/orders/entities/order-product.entity';
import { ORDER_PRODUCT } from 'src/commons/constants/schemaConst';
import { UsersModule } from 'src/users/users.module';
import { ResourcesModule } from 'src/resources/resources.module';
import { ProductRelateDepartmentSchema } from './entities/product-ralate-department.entity';
import { RelateDepartmentService } from './product-department/relate-department.service';
import { ClientsController } from './product-client.controller';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Product.name, useFactory: () => ProductSchema },
      { name: Customer.name, useFactory: () => CustomerSchema },
      { name: User.name, useFactory: () =>  UserSchema },
      { name: PRODUCT_CTG, useFactory: () => ProductCategorySchema },
      { name: PRODUCT_STATUS, useFactory: () => ProductStatusSchema },
      { name: PRODUCT_LABEL, useFactory: () => LabelSchema },
      { name: PRODUCT_RELATE_CUSTOMER, useFactory: () => ProductRelateCustomerSchema },
      { name: PRODUCT_RELATE_TODO, useFactory: () => ProductRelateTodoCustomerSchema },
      { name: PRODUCT_RELATE_DEPARTMENT, useFactory: () => ProductRelateDepartmentSchema},
      { name: Notifications.name, useFactory: () => NotificationsSchema },
      { name: ORDER_PRODUCT, useFactory: () => OrderProductSchema },      
      {
        name: PRODUCT_HISTORY, useFactory: () => {
          return ProductHistorySchema.plugin(TenantPlugin.addPlugin);
        }
      },
    ]),
    AttributesModule.forRoot(),
    NotificationsModule,
    UsersModule,
    ResourcesModule
  ],
  controllers: [
    HistoriesController,
    LabelsController,
    RelateCustomerController,
    ProductsController,
    ClientsController],
  providers: [
    ProductsService, 
    ProductLabelService, 
    HistoriesService, 
    RelateCustomerService, 
    RelateTodoService, 
    RelateDepartmentService, 
    ]
})
export class ProductsModule { }
