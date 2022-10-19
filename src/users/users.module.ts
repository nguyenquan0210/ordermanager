import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { AttributesModule } from 'src/attributes/attributes.module';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { ConfirmCodeService } from './confirmCode.service';
import { UserConfirmCodeSchema } from './entities/user-confirm.entity';
import { USER_CONFIRM_CODE, USER_KPI } from 'src/commons/constants/schemaConst';
import { MailModule } from 'src/mail/mail.module';
import { UserKPISchema } from './entities/user-kpi.entity';
import { UserKPIController } from './users-kpi.controller';
import { UserKPIService } from './user-kpi/user-kpi.service';
import { Notifications, NotificationsSchema } from 'src/notifications/entities/notification.entity';
import { FcmService } from 'src/notifications/firebase/fcm.service';
import { StatisticsController } from './user-statistics.controller';
import { ResourcesModule } from 'src/resources/resources.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.plugin(TenantPlugin.addPlugin);
          return schema;
        }
      },
      { name: USER_CONFIRM_CODE, useFactory: () => UserConfirmCodeSchema },
      { name: USER_KPI, useFactory: () => UserKPISchema },
      { name: Notifications.name, useFactory: () => NotificationsSchema },
    ]),
    AttributesModule.forRoot(),
    MailModule,
    ResourcesModule
  ],
  controllers: [UserKPIController, UsersController, StatisticsController],
  providers: [UsersService, ConfirmCodeService, UserKPIService, FcmService],
  exports: [UsersService, ConfirmCodeService, FcmService]
})
export class UsersModule { }
