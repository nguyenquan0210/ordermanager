import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { deleteManyFiles, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { nanoid } from 'nanoid';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting } from 'src/commons/dto/sorting';
import { Feedback, FeedbackDocument } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackStatus } from './interface/feedbackstatus';
import { QueryFeedback } from './dto/query-feedback.dto';
import { UserRole } from 'src/users/interface/userRoles';
import { CHECK_SIZE_FILE } from 'src/commons/constants/envConstanst';
import { StaticFile } from 'src/commons/utils/staticFile';

@Injectable()
export class FeedbacksService {

    constructor(
        @InjectModel(Feedback.name) private model: Model<FeedbackDocument>,

    ) {
    }
    async createFeedback(createFeedbackDto: CreateFeedbackDto, authUser: JwtUser) {
        let feedback = new this.model(createFeedbackDto)
        feedback.userId = authUser.userId;
        feedback.status = FeedbackStatus.WAITING;
        return feedback.withTenant(authUser.owner).save();
    }

    async findAll(userReq: JwtUser, query?: Paginate & QueryFeedback & Sorting) {
        let filter: FilterQuery<FeedbackDocument> = {};

        if (query.search) {
            filter.$text = { $search: `.*${query.search}.*`, $language: "en" };
        }

        const cmd = this.model.find({ ...filter })
            .lean({ autopopulate: true })

        if (query.isOwner) {
            cmd.where('owner', userReq.owner);
        }
        if (query.status) {
            cmd.where('status', query.status);
        }
        if (query.limit) {
            cmd.limit(query.limit);
        }
        if (query.offset) {
            cmd.skip(query.offset);
        }
        if (query.sortBy) {
            cmd.sort({ [query.sortBy]: query.sortOrder })
        }

        const totalCmd = this.model.countDocuments(cmd.getQuery());
        const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

        return { total, data };
    }

    async findOne(id: string, userReq: JwtUser) {
        var result = this.model.findById(id);
        if (userReq.role != UserRole.Admin) {
            result.byTenant(userReq.owner);
        }
        return result.orFail(new NotFoundException(ErrCode.E_FEEDBACK_NOT_FOUND)).exec();
    }

    async requestConfirmation(id: string, userReq: JwtUser) {
        const cmd = this.model.findById(id);
        if (userReq.role != UserRole.Admin) {
            cmd.byTenant(userReq.owner);
        }
        const doc = await cmd.orFail(new NotFoundException(ErrCode.E_FEEDBACK_NOT_FOUND)).exec();
        return await doc.set({ status: FeedbackStatus.PROCESSED }).save();
    }

    async remove(id: string, userReq: JwtUser) {
        const doc = await this.model.findByIdAndDelete(id).where('status', FeedbackStatus.PROCESSED)
            .orFail(new NotFoundException(ErrCode.E_FEEDBACK_NOT_FOUND))
            .exec();

        const keys = [];
        for (let i = 0; i < doc.imageList.length; i++) {
            keys.push(doc.imageList[i].url);
        }
        if (keys.length > 0) {
            const data = await deleteManyFiles(keys);
        }
        return doc;
    }

    async uploadImage(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string, description?: string) {
        if (file.size > CHECK_SIZE_FILE.IMG) {
            throw new BadRequestException(ErrCode.E_UPLOAD_FILE);
        }
        const feedback = await this.model.findById(id)
            .byTenant(userReq.owner)
            .orFail(new NotFoundException(ErrCode.E_FEEDBACK_NOT_FOUND))
            .exec();

      
        const url = `feedbacks/${userReq.owner ?? 'default'}/${feedback._id}/images/${file.filename}`;
        // move file to proper path
        // await uploadFile({
        //     file: file,
        //     filePath: url,
        //     mimetype: file.mimetype
        // })
        // uploadFile server
       
        //const filename = StaticFile.getFileName(doc.image);
            // delete file server
            // const url = StaticFile.getLocalFileUpload('menus', filename);
            // StaticFile.deleteStaticFile(url);
 

        feedback.imageList.push({
            name: filename || file.originalname,
            description: description,
            url: url,
            mimetype: file.mimetype,
            size: file.size
        });

        return await feedback.save();
    }

    getSignedUrl(id: string, owner: string, fileName: string) {
        const key = StaticFile.getLocalFileUpload('feedbacks', fileName);
        return key;
    }
}

