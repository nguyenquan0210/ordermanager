import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/orders/entities/order.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';
import { Commission, CommissionSchema } from './entities/commission.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Commission.name, useFactory: () => CommissionSchema },
      { name: Order.name, useFactory: () => OrderSchema },
      { name: User.name, useFactory: () => UserSchema },
    ])
  ],
  controllers: [
    CommissionController
  ],
  providers: [
    CommissionService
  ]
})

export class CommissionModule { }
