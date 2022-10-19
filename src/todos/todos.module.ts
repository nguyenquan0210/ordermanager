import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { TodoStatusService } from './todo-status/todo-status.service';
import { TodoStatusController } from './todo-status.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Todo, TodoSchema } from './entities/todo.entity';
import { LabelSchema } from 'src/labels/entities/label.entity';
import { TODO_STATUS, TODO_LABEL, TODO_HISTORY, PRODUCT_RELATE_TODO, CUSTOMER_RELATE_TODO, TODO_DEMAND, TODO_DEMAND_STATUS, TODO_DEMAND_LABEL, TODO_COMMENT } from 'src/commons/constants/schemaConst';
import { TodoHistoriesService } from './todo-history/todo-history.service';
import { TodoHistoriesController } from './todo-history/todo-history.controller';
import { TodoHistorySchema } from './entities/todo-history.entity';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { RelateTodoService } from 'src/products/product-todo/relate-todo.service';
import { ProductRelateTodoCustomerSchema } from 'src/products/entities/product-relate-todo.entity';
import { CustomerRelateTodoService } from 'src/customers/customer-relate/customer-relate-todo.service';
import { CustomerRelateTodoSchema } from 'src/customers/entities/customer-relate-todo.entity';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { Customer, CustomerSchema } from 'src/customers/entities/customer.entity';
import { TodoDemandSchema } from './entities/todo-demand.entity';
import { TodoDemandService } from './todo-demand/todo-demand.service';
import { TodoDemandController } from './todo-demand.controllder';
import { TodoDemandStatusController } from './todo-demand-status.controller';
import { TodoDemandStatusService } from './todo-demand-status/todo-demand-status.service';
import { TodoDemandLabelController } from './todo-demand-labels.controller';
import { TodoDemandLabelService } from './todo-demand-label/todo-demand-label.service';
import { LabelsController } from './todo-labels.controller';
import { TodoLabelService } from './todo-label/todo-label.service';
import { TodoCommentController } from './todo-comment.controller';
import { TodoCommentSchema } from './entities/todo-comment.entity';
import { TodoCommentService } from './todo-comment/todo-comment.service';
import { StatisticsController } from './todos-statistics.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Todo.name, useFactory: () => TodoSchema },
      { name: Product.name, useFactory: () => ProductSchema },     
      { name: TODO_STATUS, useFactory: () => LabelSchema },
      { name: TODO_LABEL, useFactory: () => LabelSchema },
      { name: TODO_DEMAND_LABEL, useFactory: () => LabelSchema },
      { name: TODO_DEMAND, useFactory: () => TodoDemandSchema },
      { name: TODO_DEMAND_STATUS, useFactory: () => LabelSchema },
      { name: TODO_COMMENT, useFactory: () => TodoCommentSchema },
      { name: PRODUCT_RELATE_TODO, useFactory: () => ProductRelateTodoCustomerSchema },
      { name: CUSTOMER_RELATE_TODO, useFactory: () => CustomerRelateTodoSchema },
      {
        name: Customer.name, useFactory: () => {
          return CustomerSchema.plugin(TenantPlugin.addPlugin);
        }
      },
      {
        name: TODO_HISTORY, useFactory: () => {
          return TodoHistorySchema.plugin(TenantPlugin.addPlugin);
        }
      }
    ]),
    NotificationsModule,
    UsersModule
  ],
  controllers: [
    TodoCommentController,
    StatisticsController,
    TodoDemandLabelController,
    LabelsController, 
    TodosController, 
    TodoStatusController,
    TodoHistoriesController, 
    TodoDemandController, 
    TodoDemandStatusController, 
  ],
  providers: [
    TodoCommentService,
    TodosService, 
    TodoStatusService, 
    TodoLabelService,
    TodoHistoriesService, 
    RelateTodoService, 
    CustomerRelateTodoService, 
    TodoDemandLabelService, 
    TodoDemandService, 
    TodoDemandStatusService,
  ]
})

export class TodosModule { }
