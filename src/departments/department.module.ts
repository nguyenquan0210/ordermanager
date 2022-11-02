import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
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
            }
        ])
    ],
    controllers: [DepartmentsController],
    providers: [DepartmentsService],
    exports: [DepartmentsService]
})
export class DepartmentsModule { }
