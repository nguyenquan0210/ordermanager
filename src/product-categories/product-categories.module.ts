import { Module } from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategorySchema } from './entities/product-category.entity';
import { PRODUCT_CTG } from 'src/commons/constants/schemaConst';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PRODUCT_CTG, schema: ProductCategorySchema }
    ]),
    UsersModule
  ],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService]
})
export class ProductCategoriesModule { }
