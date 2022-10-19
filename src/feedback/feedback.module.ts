import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { Feedback, FeedbackSchema } from './entities/feedback.entity';
import { FeedbacksController } from './feedback.controller';
import { FeedbacksService } from './feedback.service';

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: Feedback.name,
                useFactory: () => {
                    const schema = FeedbackSchema;
                    schema.plugin(TenantPlugin.addPlugin);
                    return schema;
                }
            }
        ])
    ],
    controllers: [FeedbacksController],
    providers: [FeedbacksService],
    exports: [FeedbacksService]
})
export class FeedbacksModule { }
