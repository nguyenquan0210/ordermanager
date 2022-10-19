import { DynamicModule, Module } from '@nestjs/common';
import { AttributesController } from './attributes.controller';
import { getConnectionToken } from '@nestjs/mongoose';
import { AttributeDocument, AttributeSchema } from './entities/attribute.entity';
import { AttrSubject } from './interface/attrSubject';
import { AttributesDynamicService } from './attribute-dynamic.service';
import { Connection } from 'mongoose';

@Module({
  controllers: [AttributesController],
})
export class AttributesModule {
  static forRoot(): DynamicModule {
    const providers = AttributesModule.createProviders();
    return {
      module: AttributesModule,
      imports: [
      ],
      providers: [
        ...providers,
      ],
      exports: [
        ...Object.values(AttrSubject)
      ]

    }
  }

  private static createProviders() {
    const providers = []
    const keys = Object.values(AttrSubject);
    keys.forEach(key => {
      // gen model
      providers.push({
        provide: 'MODEL-' + key,
        useFactory: (connection: Connection) => {
          return connection.model<AttributeDocument>(`${key}_attribute`, AttributeSchema)
        },
        inject: [getConnectionToken()]
      })

      // gen service
      providers.push({
        provide: key,
        useFactory: (model) => {
          return new AttributesDynamicService(model)
        },
        inject: ['MODEL-' + key]
      })
    });

    return providers;
  }
}
