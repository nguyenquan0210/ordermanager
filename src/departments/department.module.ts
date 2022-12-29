import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DEPARTMENT_DETAILT, PRODUCT_RELATE_COLOR, PRODUCT_RELATE_DEPARTMENT } from 'src/commons/constants/schemaConst';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { ProductRelateDepartmentSchema } from 'src/products/entities/product-ralate-department.entity';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { ProductRelateColorsSchema } from 'src/products/entities/products-ralate-color.entity';
import { RelateDepartmentService } from 'src/products/product-department/relate-department.service';
import { RelateColorService } from 'src/products/products-ralate-color/relate-color.service';
import { ProductsModule } from 'src/products/products.module';
import { ProductsService } from 'src/products/products.service';
import { DepartmentsController } from './department.controller';
import { DepartmentsService } from './department.service';
import { DepartmentDetailtService } from './departments-detailt/departments-detailt.service';
import { DepartmentDetailtsSchema } from './entities/department-detailt.entity';
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
            { name: PRODUCT_RELATE_DEPARTMENT, useFactory: () => ProductRelateDepartmentSchema },
            { name: PRODUCT_RELATE_COLOR, useFactory: () => ProductRelateColorsSchema},
            { name: DEPARTMENT_DETAILT, useFactory: () => DepartmentDetailtsSchema},
        ]),
    ],
    controllers: [DepartmentsController],
    providers: [
        DepartmentsService,
        DepartmentDetailtService,
        RelateDepartmentService,
        RelateColorService,
    ],
    exports: [DepartmentsService]
})
export class DepartmentsModule { }
