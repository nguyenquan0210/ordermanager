import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { CategoriesController } from './categories/categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RESOURCE_CTG } from 'src/commons/constants/schemaConst';
import { CategorySchema } from './categories/entities/category.entity';
import { CategoriesService } from './categories/categories.service';
import { Resource, ResourceSchema } from './entities/resource.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RESOURCE_CTG, schema: CategorySchema },
      { name: Resource.name, schema: ResourceSchema },
    ])
  ],
  controllers: [CategoriesController, ResourcesController],
  providers: [ResourcesService, CategoriesService],
  exports: [ResourcesService]
})
export class ResourcesModule {}
