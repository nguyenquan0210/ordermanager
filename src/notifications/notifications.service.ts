import { LevelAccount, UserRole } from './../users/interface/userRoles';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Notifications, NotificationsDocument } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { Sorting, SortOrder } from 'src/commons/dto/sorting';
import { FilterQuery } from 'mongoose';
import { StaffRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { nanoid } from 'nanoid';
import { deleteManyFiles, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { getExtension } from 'src/commons/utils/getExtension';
import { UsersService } from 'src/users/users.service';
import { MyLogService } from 'src/loggers/winston.logger';
import { FcmService } from './firebase/fcm.service';
import { QueryNoti } from './dto/query-notificationdto';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ResourcesService } from 'src/resources/resources.service';
import { ResourceType } from 'src/resources/inteface/resourceType';
import { StaticFile } from 'src/commons/utils/staticFile';
@Injectable()
export class NotificationsService {
  /**
   *
   */
  constructor(
    @InjectModel(Notifications.name) private notificationModel: Model<NotificationsDocument>,
    private usersService: UsersService,
    private logger: MyLogService,
    private fcmService: FcmService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly resourcesService: ResourcesService,

  ) { 
    const remind = new CronJob('0 * * * * *', () => {
      this.remindNoti();
    });
    this.schedulerRegistry.addCronJob('remindNoti', remind);
    remind.start();
  }

  async create(createNotificationDto: CreateNotificationDto, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Notification);
    const today = new Date();
    createNotificationDto.notiDate = today
    createNotificationDto.isRead = false;
    const doc = await new this.notificationModel(createNotificationDto)
    .withTenant(authUser.owner)
    if(createNotificationDto.type == NotificationType.todo||createNotificationDto.type == NotificationType.order){
      const tokens = [...await this.usersService.findToken(createNotificationDto.relateStaff)]
      let img = ''
      if(createNotificationDto.author){
        img = await this.usersService.getAvatar(createNotificationDto.author)
      }
      this.fcmService.sendMessage(
      {
        title: doc.title,
        body: doc.description,
      },
      {
        type: doc.type,
        image: img,
        ...doc.object,
      }, tokens,
      (error, result) => {
        if (error) {
          return;
        }
        const badTokens: string[] = [];
        result!.response.forEach((res, chIdx) => {
          for (let i = 0; i < res.responses.length; i++) {
            const itemRespone = res.responses[i];
            if (!itemRespone.success) {
              if (result?.singleToken) {
                badTokens.push(result.singleToken);
              } else {
                badTokens.push(result!.chunks[chIdx][i]);
              }
            }
          }
        });
        this.usersService.updateManyUserTokens(badTokens, authUser);
      })
    }
    if(createNotificationDto.type == NotificationType.product){
      doc.hide = createNotificationDto.author
    }
    if(createNotificationDto.type == NotificationType.internal){
      let tokens = [];
      if(createNotificationDto.relateStaff){
        tokens = [...await this.usersService.findToken(createNotificationDto.relateStaff)]
      }else{
        tokens = [...await this.usersService.findAllToken(authUser)]
      }
      this.fcmService.sendMessage(
      {
        title: doc.title,
        body: doc.description,
      },
      {
        type: doc.type,
        image: "",
        ...doc.object,
      }, tokens,
      (error, result) => {
        if (error) {
          return;
        }
        const badTokens: string[] = [];
        result!.response.forEach((res, chIdx) => {
          for (let i = 0; i < res.responses.length; i++) {
            const itemRespone = res.responses[i];
            if (!itemRespone.success) {
              if (result?.singleToken) {
                badTokens.push(result.singleToken);
              } else {
                badTokens.push(result!.chunks[chIdx][i]);
              }
            }
          }
        });
        this.usersService.updateManyUserTokens(badTokens, authUser);
      })
    }
    return doc.save();
  }

  async createNoti(createNotificationDto: CreateNotificationDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Notification);
    if(!createNotificationDto.owner){
      createNotificationDto.owner =  authUser.owner
    }
    if(!createNotificationDto.author){
      createNotificationDto.author =  authUser.userId
    }
    if(!createNotificationDto.notiDate){
      const today = new Date();
      createNotificationDto.notiDate = today
    }
    const noti = await new this.notificationModel(createNotificationDto)
      .withTenant(authUser.owner)
    if (createNotificationDto.isRemind == true) {
      const dateRemind = new Date(createNotificationDto?.notiDate);
      dateRemind.setMinutes(dateRemind.getMinutes() - (createNotificationDto?.minutes|| 0));
      noti.dateRemind = dateRemind;
    }
    
    let tokens = []
    if(createNotificationDto.relateStaff){
      tokens = [...await this.usersService.findToken(createNotificationDto.relateStaff)]
    }else{
      tokens = [...await this.usersService.findAllToken(authUser)]
    }
    let img = await this.usersService.getAvatar(createNotificationDto.author)
    this.fcmService.sendMessage(
      {
        title: noti.title,
        body: noti.description,
      },
      {
        type: noti.type,
        image: img,
        ...noti.object,
      }, tokens,
      (error, result) => {
        if (error) {
          return;
        }
        const badTokens: string[] = [];
        result!.response.forEach((res, chIdx) => {
          for (let i = 0; i < res.responses.length; i++) {
            const itemRespone = res.responses[i];
            if (!itemRespone.success) {
              if (result?.singleToken) {
                badTokens.push(result.singleToken);
              } else {
                badTokens.push(result!.chunks[chIdx][i]);
              }
            }
          }
        });
        this.usersService.updateManyUserTokens(badTokens, authUser);
      })
      
    return noti.save();
  }

  async findAll(authUser: JwtUser, query?: Paginate & QueryNoti & Sorting) {
    let filter: FilterQuery<NotificationsDocument> = {};

    if (query.search) {
      filter.$text = { $search: `.*${ query.search }.*`, $language: "en" };
    }

    if (query.fromDate) {
      filter.createdAt = { $gte: query.fromDate };
    }

    if (query.toDate) {
      filter.createdAt = { ...filter.createdAt, $lte: query.toDate };
    }

    // const today = new Date();
    // today.setHours(23, 59, 59);
    // filter.notiDate = { $lte: today };

    // if (query.toDateAllNoti) {
    //   filter.notiDate = { ...filter.notiDate, $lte: query.toDateAllNoti };
    // }

    const cmd = this.notificationModel.find({...filter, hide: { $ne: authUser.userId }})
          .byTenant(authUser.owner)
          .lean({ autopopulate: true })

    if(query.type){
      if(query.type !== NotificationType.all){
          cmd.where('type', query.type);
      }
    }
    cmd.where('relateStaff').in([null, authUser.userId]);
    // cmd.where('relateStaffs',authUser.userId)
    if (query.limit) {
      cmd.limit(query.limit);
    }
    if (query.offset) {
      cmd.skip(query.offset);
    }
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }else{
      cmd.sort({ ['createdAt']: SortOrder.desc })
    }

    const totalCmd = this.notificationModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);

    for (let index = 0; index < data?.length; index++) {
      const read = data[index].userRead.find((item) => item == authUser.userId);
      if(read != undefined){
        data[index].isRead = true;
      }
      data[index].userRead = [];
    }

    return { total, data };
  }

  async notiUnread(authUser: JwtUser) {

    const today = new Date();
    today.setHours(23, 59, 59);

    const doc = this.notificationModel.find({notiDate: {$lte: today}, userRead: {$nin: [authUser.userId]}, hide: { $ne: authUser.userId }})
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .where('relateStaff').in([null, authUser.userId])
    const totalCmd = this.notificationModel.countDocuments(doc.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), doc.exec()]);

    return { total } ;
  }

  findOne(id: string, authUser: JwtUser) {
    return this.notificationModel.findById(id)
        .byTenant(authUser.owner)
        .lean({ autopopulate: true })
        .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
        .exec();
  }

  async readAll(authUser: JwtUser) {
    const today = new Date();
    today.setHours(23, 59, 59);
    const doc = this.notificationModel.find({notiDate: {$lte: today}, userRead: {$nin: [authUser.userId]}, hide: { $ne: authUser.userId }})
        .byTenant(authUser.owner)
        .lean({ autopopulate: true })
        .where('relateStaff').in([null, authUser.userId])
    const totalCmd = this.notificationModel.countDocuments(doc.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), doc.exec()]);

    for (let index = 0; index < data?.length; index++) {
      await this.update(data[index]._id, {isRead: true}, authUser)
    }
    // const cmd = await this.notificationModel.updateMany({}, { $set: { userRead: [authUser.userId] } })
    //   .byTenant(authUser.owner).exec();

    return { total, data };
  }

  async update(id: string, updateSpeakerDto: UpdateNotificationDto, authUser: JwtUser) {
    // CheckRoleStaff(authUser, StaffRole.Notification);
    const doc = await this.notificationModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();
    if(updateSpeakerDto.isRead == true){
      updateSpeakerDto.userRead = [...doc.userRead, authUser.userId];
      updateSpeakerDto.isRead = false;
    }

    if(updateSpeakerDto?.isRemind == true){
      let dateRemind = new Date();
      if(updateSpeakerDto?.notiDate){
        dateRemind = new Date(updateSpeakerDto?.notiDate);
      }else{
        dateRemind = new Date(doc?.notiDate);
      }
      if(updateSpeakerDto?.minutes){
        dateRemind.setMinutes(dateRemind.getMinutes() - (updateSpeakerDto?.minutes|| 0));
      }else{
        dateRemind.setMinutes(dateRemind.getMinutes() - (doc?.minutes|| 0));
      }
      doc.dateRemind = dateRemind;
    }else{
      if(updateSpeakerDto.minutes){
        doc.dateRemind.setMinutes(doc.dateRemind.getMinutes() - updateSpeakerDto.minutes)
      }
    }
 
    return this.notificationModel.findByIdAndUpdate(id, updateSpeakerDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();
  }

  async remove(id: string, userReq: JwtUser) {
    CheckRoleStaff(userReq, StaffRole.Notification);

    const speaker = await this.notificationModel.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    // const keys = [];
    // for (let i = 0; i < speaker.imageVideoList.length; i++) {
    //   keys.push(speaker.imageVideoList[i].url);
    // }

    // for (let i = 0; i < speaker.documentList.length; i++) {
    //   keys.push(speaker.documentList[i].url);
    // }
    // if(keys.length > 0){
    //   const data = await deleteManyFiles(keys);
    // }
    return speaker;
  }

  async uploadAttachments(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    
    const noti = await this.notificationModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();
   
    const url = `notifications/${userReq.owner}/${id}/images/${file.filename}`;
    noti.imageVideoList.push({
      name: filename || file.originalname,
      url: url,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await noti.save();

    return result;
  }

  async uploadDocuments(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    const speaker = await this.notificationModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();
          
      const url = `notifications/${userReq.owner}/${id}/file/${file.filename}`;
    
      speaker.documentList.push({
        name: filename || file.originalname,
        url: url,
        mimetype: file.mimetype,
        size: file.size
      });

    const result = await speaker.save();
    return result;
  }

  async deleteAttachments(id: string, fileId: string, userReq: JwtUser) {
    const speaker = await this.notificationModel.findById(id)
      .byTenant(userReq.owner)
      .select('imageVideoList')
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const fileObj = speaker.imageVideoList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_SPEAKER_FILE_NOT_FOUND);
    }

    speaker.imageVideoList.pull(fileObj);
    const result = await speaker.save();
    return result;
  }

  async deleteDocuments(id: string, fileId: string, userReq: JwtUser) {
    const speaker = await this.notificationModel.findById(id)
      .byTenant(userReq.owner)
      .select('documentList')
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const fileObj = speaker.documentList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_SPEAKER_FILE_NOT_FOUND);
    }
    speaker.documentList.pull(fileObj);
    const result = await speaker.save();
    return result;
  }

  getSignedUrl(id: string, owner: string, type: string, fileName: string) {
    const key = StaticFile.getLocalFileUpload('notifications', fileName);
    return key;
  }

  private async remindNoti() {
    const date = new Date();
    const notification = await this.notificationModel.find({$expr: {
        $and: [
          {
            "$eq": [{"$year": "$dateRemind"}, date.getFullYear()]
          },
          {
            "$eq": [{"$month": "$dateRemind"}, (date.getMonth()+1)]
          },
          {
            "$eq": [{"$dayOfMonth": "$dateRemind"}, date.getDate()]
          },
          {
            "$eq": [{"$hour": "$dateRemind"}, date.getHours()]
          },
          {
            "$eq": [{"$minute": "$dateRemind"}, date.getMinutes()]
          }
        ]
      }})
      .where('isRemind', true)
      .lean()
      .exec();
      
    notification.forEach(noti => {
      const notify = {
        title: "Notification remind",
        description: `Notification remind`,
        type: NotificationType.internal,
        author: noti.author ? (noti.author['_id'] ?? noti.author) : undefined,
        image: "",
        isRead: false,
        relateStaff: noti.relateStaff || undefined,
        object: {
          id: noti._id.toString(),
          name: noti.title,
          discription: noti.description,
        },
        owner: noti.owner
      };
      this.create({ ...notify }, {
        userId: noti.author ? (noti.author['_id'] ?? noti.author) : undefined,
        username: '',
        role: UserRole.Owner,
        owner: noti.owner || undefined,
      });
    });
  }
}
