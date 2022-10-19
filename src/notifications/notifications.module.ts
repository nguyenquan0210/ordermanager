import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notifications, NotificationsSchema } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UsersModule } from 'src/users/users.module';
import { FcmService } from './firebase/fcm.service';
import { ResourcesModule } from 'src/resources/resources.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Notifications.name, useFactory: () => NotificationsSchema },
    ]),
    UsersModule,
    ResourcesModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmService],
  exports: [NotificationsService, FcmService],
})

export class NotificationsModule { }
