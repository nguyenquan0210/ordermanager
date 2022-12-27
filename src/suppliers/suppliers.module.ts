import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Suppliers, SuppliersSchema } from './entities/suppliers.entity';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Suppliers.name, schema: SuppliersSchema }
    ]),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService]
})
export class SuppliersModule { }
