import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PRODUCT_RELATE_DEPARTMENT } from 'src/commons/constants/schemaConst';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { ProductRelateDepartmentSchema } from 'src/products/entities/product-ralate-department.entity';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { RelateDepartmentService } from 'src/products/product-department/relate-department.service';
import { DepartmentsController } from './department.controller';
import { DepartmentsService } from './department.service';
import { Department, DepartmentSchema } from './entities/department.entity';


@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: Department.name,
                useFactory: () => {
                    const schema = DepartmentSchema;
                    schema.plugin(TenantPlugin.addPlugin);
                    return schema;
                }
            },
            { name: Product.name, useFactory: () => ProductSchema },     
            { name: PRODUCT_RELATE_DEPARTMENT, useFactory: () => ProductRelateDepartmentSchema},
        ])
    ],
    controllers: [DepartmentsController],
    providers: [DepartmentsService, RelateDepartmentService],
    exports: [DepartmentsService]
})
export class DepartmentsModule { }
