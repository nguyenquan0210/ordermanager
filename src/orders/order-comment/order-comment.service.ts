import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { ORDER_COMMENT } from 'src/commons/constants/schemaConst';
import { CreateOrderCommentDto, CreateOrderReplyDto } from '../dto/create-order-comment.dto';
import { OrderCommentDocument } from '../entities/order-comment.entity';
import { OrdersService } from '../orders.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
@Injectable()
export class OrderCommentService {

    constructor(
        @InjectModel(ORDER_COMMENT) private modelOrderComment: Model<OrderCommentDocument>,
        private ordersService: OrdersService,
        private notificationService: NotificationsService,
    ) {
    }

    async create(createOrderCommentDto: CreateOrderCommentDto, authUser: JwtUser) {
        if(!createOrderCommentDto.order){
            throw new NotFoundException(ErrCode.E_ORDER_NOT_FOUND)
        }
        const doc = new this.modelOrderComment(createOrderCommentDto)
        .withTenant(authUser.owner);
        doc.userId = authUser.userId;
        doc.idOrder = createOrderCommentDto.order;
        doc.userName = authUser.username;

        const order = await this.ordersService.findOne(createOrderCommentDto.order, authUser);
        if(order.createdBy._id != authUser.userId){
            const notify = {
                title: `Comment order: ${order.name}`,
                description: `${authUser.fullName} commented: ${createOrderCommentDto.contentComment}`,
                type: NotificationType.order,
                author: authUser.userId,
                image: '',
                isRead: false,
                relateStaff: order.createdBy._id,
                object: {
                  id: order._id.toString(),
                  name: order.name,
                  discription: order.description,
                },
                owner: authUser.owner
              }
            this.notificationService.create( { ...notify }, authUser)
        }
        return doc.save();
    }
   
    async createReply(createOrderReplyDto: CreateOrderReplyDto, authUser: JwtUser) {
        const doc = new this.modelOrderComment(createOrderReplyDto)
        .withTenant(authUser.owner);
        doc.userId = authUser.userId;
        doc.userName = authUser.username;

        const comment = await this.modelOrderComment.findById(createOrderReplyDto.idComment)
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
            .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
            .exec();
        
        doc.idOrder = comment.order;
        const order = await this.ordersService.findOne(comment.order, authUser);
            if(comment.userId._id != authUser.userId){
                const notify = {
                    title: `Reply comment order: ${order.name}`,
                    description: `${authUser.fullName} replied to the comment with the content: ${createOrderReplyDto.contentComment}`,
                    type: NotificationType.order,
                    author: authUser.userId,
                    image: '',
                    isRead: false,
                    relateStaff: comment.userId._id,
                    object: {
                        idComment: comment._id.toString(),
                        id: order._id.toString(),
                        name: order.name,
                    },
                    owner: authUser.owner
                  }
                this.notificationService.create( { ...notify }, authUser)
    
                let replys = comment.replys.map((item)=>item.userId._id)
                let listId = replys.reduce((accumulator, element)=>{
                    if (accumulator.indexOf(element) === -1) {
                        accumulator.push(element)
                    }
                    return accumulator
                }, [])
                listId.forEach( id => {
                    if(id != authUser.userId){
                        if(id.toString().indexOf(comment.userId._id)==-1){
                            const notify = {
                                title: `Reply comment order: ${order.name}`,
                                description: `${authUser.fullName} replied to the comment with the content: ${createOrderReplyDto.contentComment}`,
                                type: NotificationType.order,
                                author: authUser.userId,
                                image: '',
                                isRead: false,
                                relateStaff: id,
                                object: {
                                    idComment: comment._id.toString(),
                                    id: order._id.toString(),
                                    name: order.name,
                                },
                                owner: authUser.owner
                              }
                            this.notificationService.create( { ...notify }, authUser)
                        }
                    }
                })
            }else {
                let replys = comment.replys.map((item)=>item.userId._id)
                let listId = replys.reduce((accumulator, element)=>{
                    if (accumulator.indexOf(element) === -1) {
                        accumulator.push(element)
                    }
                    return accumulator
                }, [])
                listId.forEach( id => {
                    if(id != authUser.userId){
                        const notify = {
                            title: `Reply comment order: ${order.name}`,
                            description: `${authUser.fullName} replied to the comment with the content: ${createOrderReplyDto.contentComment}`,
                            type: NotificationType.order,
                            author: authUser.userId,
                            image: '',
                            isRead: false,
                            relateStaff: id,
                            object: {
                                idComment: comment._id.toString(),
                                id: order._id.toString(),
                                name: order.name,
                            },
                            owner: authUser.owner
                          }
                        this.notificationService.create( { ...notify }, authUser)
                    }
                })
            }
        this.modelOrderComment.findByIdAndUpdate(createOrderReplyDto.idComment, {replys: [...comment.replys,doc._id]})
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
            .exec();
        return doc.save();
    }

    async findAll(idOrder: string, authUser: JwtUser) {
        const cmd = this.modelOrderComment.find()
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
        if(idOrder){
            cmd.where('order', idOrder);
        }
        const totalCmd = this.modelOrderComment.countDocuments(cmd.getQuery());
        const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

        return { total, data }
    }

    // findOne(id: string, authUser: JwtUser) {
    //     return this.modelTodoComment.findById(id)
    //         .byTenant(authUser.owner)
    //         .lean({ autopopulate: true })
    //         .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
    //         .exec();
    // }

    // update(id: string, updateLabelDto: UpdateLabelDto, authUser: JwtUser) {
    //     // CheckRoleStaff(authUser, StaffRole.Todo)

    //     return this.modelTodoComment.findByIdAndUpdate(id, updateLabelDto)
    //         .byTenant(authUser.owner)
    //         .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
    //         .exec();
    // }

    remove(id: string, authUser: JwtUser) {
        return this.modelOrderComment.findByIdAndDelete(id)
            .byTenant(authUser.owner)
            .where('userId', authUser.userId)
            .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
            .exec();
    }
}
