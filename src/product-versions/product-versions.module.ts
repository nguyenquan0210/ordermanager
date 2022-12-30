import { Module } from '@nestjs/common';
import { ProductVerstionsService } from './product-versions.service';
import { ProductVerstionsController } from './product-versions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductVerstionsSchema } from './entities/product-versions.entity';
import { PRODUCT_VERSIONS } from 'src/commons/constants/schemaConst';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PRODUCT_VERSIONS, schema: ProductVerstionsSchema }
    ]),
    UsersModule
  ],
  controllers: [ProductVerstionsController],
  providers: [ProductVerstionsService]
})
export class ProductVerstionsModule { }
