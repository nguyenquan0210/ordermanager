import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { USER_KPI } from 'src/commons/constants/schemaConst';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { CreateNotificationDto } from 'src/notifications/dto/create-notification.dto';
import { Notifications, NotificationsDocument } from 'src/notifications/entities/notification.entity';
import { FcmService } from 'src/notifications/firebase/fcm.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateUserKPIDto } from '../dto/create-user-kpi.dto';
import { UpdateUserKPIDto } from '../dto/update-user-kpi.dto';
import { UserKPIDocument } from '../entities/user-kpi.entity';
import { UserRole } from '../interface/userRoles';
import { UsersService } from '../users.service';

@Injectable()
export class UserKPIService {

    constructor(
        @InjectModel(USER_KPI) private modelUserKPI: Model<UserKPIDocument>,
        @InjectModel(Notifications.name) private notificationModel: Model<NotificationsDocument>,
        private usersService: UsersService,
        private fcmService: FcmService,

    ) {
    }
    async create(createUserKPIDto: CreateUserKPIDto, authUser: JwtUser) {
        if(authUser.role == UserRole.Staff){
            throw new ForbiddenException()
        }
        const user = await this.usersService.findOne(createUserKPIDto.userId);
        if(!createUserKPIDto.kpiDate){
            createUserKPIDto.kpiDate = new Date()
        }
        const check = await this.findOneKpi(createUserKPIDto.userId, createUserKPIDto.kpiDate, authUser);
        
        if(check){
            throw new BadRequestException('User KPI Existed This Month')
        }
        const doc = new this.modelUserKPI(createUserKPIDto)
            .withTenant(authUser.owner);

        const notify = {
            title: 'Create KPI',
            description: `KPI`,
            type: NotificationType.kpi,
            author: authUser.userId,
            image: '',
            isRead: false,
            relateStaff: createUserKPIDto.userId,
            object: { 
                doc
            },
            owner: authUser?.owner
        };
        this.createNoti({ ...notify }, authUser);
        return doc.save();
    }

    async findAll(authUser: JwtUser, userId?: string, date?: Date) {
        let filter = {};
        if(date){
            date = new Date(date);
            filter = { ...filter, $expr: {
                $and: [
                    {
                        "$eq": [{"$month": "$kpiDate"}, (date.getMonth()+1)]
                    },
                    {
                        "$eq": [{"$year": "$kpiDate"}, date.getFullYear()]
                    }
                ]
            }};
        }
        const cmd = this.modelUserKPI.find({...filter})
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
        if(userId){
            cmd.where('userId', userId);
        }
       
        const totalCmd = this.modelUserKPI.countDocuments(cmd.getQuery());
        const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

        return { total, data }
    }

    findOne(id: string, authUser: JwtUser) {
        return this.modelUserKPI.findById(id)
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
            .orFail(new NotFoundException(ErrCode.E_USER_KPI_NOT_FOUND))
            .exec();
    }

    findOneKpi(userId: string, date: Date, authUser: JwtUser) {
        date = new Date(date)
        return this.modelUserKPI.findOne({
            $expr: {
                $and: [
                    {
                        "$eq": [{"$month": "$kpiDate"}, (date.getMonth()+1)]
                    },
                    {
                        "$eq": [{"$year": "$kpiDate"}, date.getFullYear()]
                    }
                ]
            }})
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
            .where({'userId': userId})
            .exec();
    }

    async update(id: string, updateUserKPIDto: UpdateUserKPIDto, authUser: JwtUser) {
        if(authUser.role == UserRole.Staff){
            throw new ForbiddenException()
        }
        const doc = await this.modelUserKPI.findById(id)
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_USER_KPI_NOT_FOUND))
            .exec();
        if(updateUserKPIDto.userId && updateUserKPIDto.userId == doc.userId._id){
            const user = await this.usersService.findOne(updateUserKPIDto.userId);
            if(updateUserKPIDto.kpiDate){
                const date = new Date(updateUserKPIDto.kpiDate)
                if(date.toISOString().slice(0,7) != doc.kpiDate.toISOString().slice(0,7)){
                    const check = await this.findOneKpi(updateUserKPIDto.userId, updateUserKPIDto.kpiDate, authUser);
                    if(check){
                        throw new BadRequestException('User KPI Existed This Month')
                    }
                }
            }
        }
        if(updateUserKPIDto.userId && updateUserKPIDto.userId != doc.userId._id){
            const user = await this.usersService.findOne(updateUserKPIDto.userId);
            if(updateUserKPIDto.kpiDate){
                const check = await this.findOneKpi(updateUserKPIDto.userId, updateUserKPIDto.kpiDate, authUser);
                if(check){
                    throw new BadRequestException('User KPI Existed This Month')
                }
            }
        }
        if(!updateUserKPIDto.userId){
            if(updateUserKPIDto.kpiDate){
                const date = new Date(updateUserKPIDto.kpiDate)
                if(date.toISOString().slice(0,7) != doc.kpiDate.toISOString().slice(0,7)){
                    const check = await this.findOneKpi(doc.userId._id, updateUserKPIDto.kpiDate, authUser);
                    if(check){
                        throw new BadRequestException('User KPI Existed This Month')
                    }
                }
            }
        }
        const kpiDate = updateUserKPIDto?.kpiDate || doc.kpiDate ;
        const notify = {
            title: 'Update KPI',
            description: `KPI`,
            type: NotificationType.kpi,
            author: authUser.userId,
            image: '',
            isRead: false,
            relateStaff: updateUserKPIDto.userId || doc.userId._id,
            object: { 
                doc
            },
            owner: authUser?.owner
        };
        this.createNoti({ ...notify }, authUser);

        return doc.set(updateUserKPIDto).save();
    }

    remove(id: string, authUser: JwtUser) {
        if(authUser.role == UserRole.Staff){
            throw new ForbiddenException()
        }
        return this.modelUserKPI.findByIdAndDelete(id)
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_USER_KPI_NOT_FOUND))
            .exec();
    }

    async createNoti(createNotificationDto: CreateNotificationDto, authUser: JwtUser) {
        const today = new Date();
        createNotificationDto.notiDate = today
        createNotificationDto.isRead = false;
        const doc = await new this.notificationModel(createNotificationDto)
            .withTenant(authUser.owner)
        return doc.save();
      }
}
