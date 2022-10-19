import { Module } from '@nestjs/common';
import { StatisticsController } from './orders-statistics.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { OrderStatusSchema } from 'src/order-status/entities/order-status.entity';
import { ORDER_STATUS, ORDER_LABEL, ORDER_HISTORY, ORDER_COMMENT, ORDER_PRODUCT, USER_KPI } from 'src/commons/constants/schemaConst';
import { LabelSchema } from 'src/labels/entities/label.entity';
import { LabelsController } from './order-labels.controller';
import { OrderLabelService } from './order-label/order-label.service';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Notifications, NotificationsSchema } from 'src/notifications/entities/notification.entity';
import { HistoriesController } from './histories/histories.controller';
import { HistoriesService } from './histories/histories.service';
import { OrderHistorySchema } from './entities/order-history.entity';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { OrderCommentController } from './order-comment.controller';
import { OrderCommentSchema } from './entities/order-comment.entity';
import { OrderProductSchema } from './entities/order-product.entity';
import { OrderCommentService } from './order-comment/order-comment.service';
import { OrderProductService } from './order-product/order-product.service';
import { OrderStatusService } from '../order-status/order-status.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Todo, TodoSchema } from 'src/todos/entities/todo.entity';
import { UserKPISchema } from 'src/users/entities/user-kpi.entity';
import { CustomerModule } from 'src/customers/customer.module';
import { Customer, CustomerSchema } from 'src/customers/entities/customer.entity';
import { Commission, CommissionSchema } from 'src/commissions/entities/commission.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Todo.name, useFactory: () => TodoSchema },
      { name: Order.name, useFactory: () => OrderSchema },
      { name: User.name, useFactory: () => UserSchema },
      { name: Customer.name, useFactory: () => CustomerSchema },
      { name: Product.name, useFactory: () => ProductSchema },
      { name: ORDER_STATUS, useFactory: () => OrderStatusSchema },
      { name: ORDER_LABEL, useFactory: () => LabelSchema },
      { name: ORDER_COMMENT, useFactory: () => OrderCommentSchema },
      { name: ORDER_PRODUCT, useFactory: () => OrderProductSchema },
      { name: Notifications.name, useFactory: () => NotificationsSchema },
      { name: USER_KPI, useFactory: () => UserKPISchema },
      { name: Commission.name, useFactory: () => CommissionSchema },
      {
        name: ORDER_HISTORY, useFactory: () => {
          return OrderHistorySchema.plugin(TenantPlugin.addPlugin);
        }
      },
    ]),
    NotificationsModule,
  ],
  controllers: [
    OrderCommentController,
    StatisticsController,
    LabelsController,
    OrdersController,
    HistoriesController
  ],
  providers: [
    OrderCommentService,
    OrderProductService,
    OrdersService,
    OrderStatusService,
    OrderLabelService,
    HistoriesService
  ]
})
export class OrdersModule { }
