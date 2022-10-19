import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { TODO_COMMENT } from 'src/commons/constants/schemaConst';
import { CreateTodoCommentDto, CreateTodoReplyDto } from '../dto/create-todo-comment.dto';
import { TodoCommentDocument } from '../entities/todo-comment.entity';
import { TodosService } from '../todos.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';

@Injectable()
export class TodoCommentService {

    constructor(
        @InjectModel(TODO_COMMENT) private modelTodoComment: Model<TodoCommentDocument>,
        private todosService: TodosService,
        private notificationService: NotificationsService,

    ) {
    }

    async create(createTodoCommentDto: CreateTodoCommentDto, authUser: JwtUser) {
        if(!createTodoCommentDto.todo){
            throw new NotFoundException(ErrCode.E_TODO_NOT_FOUND)
        }
        const doc = new this.modelTodoComment(createTodoCommentDto)
            .withTenant(authUser.owner);
        doc.userId = authUser.userId;
        doc.idTodo = createTodoCommentDto.todo;
        doc.userName = authUser.username;

        const todo = await this.todosService.findOne(createTodoCommentDto.todo, authUser);
        if(todo.relateStaffs[0]._id != authUser.userId){
            const notify = {
                title: `Comment todo: ${todo.name}`,
                description: `${authUser.fullName} commented: ${createTodoCommentDto.contentComment}`,
                type: NotificationType.todo,
                author: authUser.userId,
                image: '',
                isRead: false,
                relateStaff: todo.relateStaffs[0]._id,
                object: {
                  id: todo._id.toString(),
                  name: todo.name,
                  discription: todo.description,
                },
                owner: authUser.owner
              }
            this.notificationService.create( { ...notify }, authUser)
        }
        return doc.save();
    }

    async createReply(createTodoReplyDto: CreateTodoReplyDto, authUser: JwtUser) {
        const doc = new this.modelTodoComment(createTodoReplyDto)
        .withTenant(authUser.owner);
        doc.userId = authUser.userId;
        doc.userName = authUser.username;

        const comment = await this.modelTodoComment.findById(createTodoReplyDto.idComment)
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
            .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
            .exec();
            
        doc.idTodo = comment.todo;
        const todo = await this.todosService.findOne(comment.todo, authUser);
        if(comment.userId._id != authUser.userId){
            const notify = {
                title: `Reply comment todo: ${todo.name}`,
                description: `${authUser.fullName} replied to the comment with the content: ${createTodoReplyDto.contentComment}`,
                type: NotificationType.todo,
                author: authUser.userId,
                image: '',
                isRead: false,
                relateStaff: comment.userId._id,
                object: {
                    idComment: comment._id.toString(),
                    id: todo._id.toString(),
                    name: todo.name,
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
                            title: `Reply comment todo: ${todo.name}`,
                            description: `${authUser.fullName} replied to the comment with the content: ${createTodoReplyDto.contentComment}`,
                            type: NotificationType.todo,
                            author: authUser.userId,
                            image: '',
                            isRead: false,
                            relateStaff: id,
                            object: {
                                idComment: comment._id.toString(),
                                id: todo._id.toString(),
                                name: todo.name,
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
                        title: `Reply comment todo: ${todo.name}`,
                        description: `${authUser.fullName} replied to the comment with the content: ${createTodoReplyDto.contentComment}`,
                        type: NotificationType.todo,
                        author: authUser.userId,
                        image: '',
                        isRead: false,
                        relateStaff: id,
                        object: {
                            idComment: comment._id.toString(),
                            id: todo._id.toString(),
                            name: todo.name,
                        },
                        owner: authUser.owner
                      }
                    this.notificationService.create( { ...notify }, authUser)
                }
            })
        }
        this.modelTodoComment.findByIdAndUpdate(createTodoReplyDto.idComment, {replys: [...comment.replys,doc._id]})
            .byTenant(authUser.owner)
            .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
            .exec();
        return doc.save();
    }

    async findAll(idTodo: string, authUser: JwtUser) {
        const cmd = this.modelTodoComment.find()
            .byTenant(authUser.owner)
            .lean({ autopopulate: true })
        if(idTodo){
            cmd.where('todo', idTodo);
        }
        const totalCmd = this.modelTodoComment.countDocuments(cmd.getQuery());
        const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

        return { total, data }
    }

    // findOne(id: string, authUser: JwtUser) {
    //     return this.modelTodoComment.findById(id)
    //         .byTenant(authUser.owner)
    //         .lean({ autopopulate: true })
    //         .orFail(new NotFoundException(ErrCode.E_LABEL_NOT_FOUND))
    //         .exec();
    // }
    // update(id: string, updateLabelDto: UpdateLabelDto, authUser: JwtUser) {
    //     // CheckRoleStaff(authUser, StaffRole.Todo)

    //     return this.modelTodoComment.findByIdAndUpdate(id, updateLabelDto)
    //         .byTenant(authUser.owner)
    //         .orFail(new NotFoundException(ErrCode.E_LABEL_NOT_FOUND))
    //         .exec();
    // }

    remove(id: string, authUser: JwtUser) {

        return this.modelTodoComment.findByIdAndDelete(id)
            .byTenant(authUser.owner)
            .where('userId', authUser.userId)
            .orFail(new NotFoundException(ErrCode.E_COMMENT_NOT_FOUND))
            .exec();
    }
}
