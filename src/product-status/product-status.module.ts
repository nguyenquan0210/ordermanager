import { Module } from '@nestjs/common';
import { ProductStatusService } from './product-status.service';
import { ProductStatusController } from './product-status.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductStatusSchema } from './entities/product-status.entity';
import { PRODUCT_STATUS } from 'src/commons/constants/schemaConst';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PRODUCT_STATUS, schema: ProductStatusSchema }])
  ],
  controllers: [ProductStatusController],
  providers: [ProductStatusService]
})
export class ProductStatusModule { }
