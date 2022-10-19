import { Module } from '@nestjs/common';
import { OrderStatusController } from './order-status.controller';
import { OrderStatusService } from './order-status.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderStatusSchema } from './entities/order-status.entity';
import { ORDER_STATUS } from 'src/commons/constants/schemaConst';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ORDER_STATUS, schema: OrderStatusSchema }])
  ],
  controllers: [OrderStatusController],
  providers: [OrderStatusService]
})
export class OrderStatusModule {}