import { Module } from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { ProductTypesController } from './product-types.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductTypesSchema } from './entities/product-types.entity';
import { PRODUCT_TYPES } from 'src/commons/constants/schemaConst';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PRODUCT_TYPES, schema: ProductTypesSchema }
    ]),
    UsersModule
  ],
  controllers: [ProductTypesController],
  providers: [ProductTypesService]
})
export class ProductTypesModule { }
