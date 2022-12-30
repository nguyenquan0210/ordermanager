import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { connectUrl, connectOptions } from './configs/mongo.cnf';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './commons/filters/exceptionFilter';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { CustomerModule } from './customers/customer.module';
import { LoggerModule } from './loggers/logger.module';
import { TodosModule } from './todos/todos.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProductStatusModule } from './product-status/product-status.module';
import { MailModule } from './mail/mail.module';
import { ResourcesModule } from './resources/resources.module';
// import { SpeakerStylesModule } from './speaker-styles/speaker-styles.module';
// import { SpeakersModule } from './speakers/speakers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { OrderStatusModule } from './order-status/order-status.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FeedbacksModule } from './feedback/feedback.module';
import { CommissionModule } from './commissions/commission.module';
import { DepartmentsModule } from './departments/department.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { ProductVerstions } from './product-versions/entities/product-versions.entity';
import { ProductVerstionsModule } from './product-versions/product-versions.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(connectUrl, connectOptions),
    AuthModule,
    UsersModule,
    SuppliersModule,
    DepartmentsModule,
    FeedbacksModule,
    ProductCategoriesModule,
    ProductTypesModule,
    ProductVerstionsModule,
    //ProductStatusModule,
    ProductsModule,
    CustomerModule,
    LoggerModule,
    TodosModule,
    MailModule,
    ResourcesModule,
    NotificationsModule,
    // SpeakerStylesModule,
    // SpeakersModule,
    OrdersModule,
    OrderStatusModule,
    CommissionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule { }
