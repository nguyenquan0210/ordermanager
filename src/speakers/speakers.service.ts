import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { CreateSpeakersDto } from './dto/create-speaker.dto';
import { Speakers, SpeakersDocument } from './entities/speaker.entity';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { nanoid } from 'nanoid';
import { getExtension } from 'src/commons/utils/getExtension';
import { deleteManyFiles, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { StaffRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';

@Injectable()
export class SpeakersService {
  /**
   *
   */
  constructor(
    @InjectModel(Speakers.name) private speakerModel: Model<SpeakersDocument>
  ) { }
  create(createSpeakerDto: CreateSpeakersDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Notification);

    return new this.speakerModel(createSpeakerDto)
      .withTenant(authUser.owner)
      .save();
  }

  async findAll(authUser: JwtUser, query?: Paginate) {
    var cmd = this.speakerModel.find()
          .byTenant(authUser.owner)
          .lean({ autopopulate: true })

    if (query.limit) {
      cmd.limit(query.limit);
    }
    if (query.offset) {
      cmd.skip(query.offset);
    }

    const totalCmd = this.speakerModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    
    return { total, data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.speakerModel.findById(id)
        .byTenant(authUser.owner)
        .lean({ autopopulate: true })
        .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
        .exec();
  }

  update(id: string, updateSpeakerDto: UpdateSpeakerDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Notification);

    return this.speakerModel.findByIdAndUpdate(id, updateSpeakerDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();
  }

  async remove(id: string, userReq: JwtUser) {
    CheckRoleStaff(userReq, StaffRole.Notification);

    const speaker = await this.speakerModel.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const keys = [];
    for (let i = 0; i < speaker.imageVideoList.length; i++) {
      keys.push(speaker.imageVideoList[i].url);
    }

    for (let i = 0; i < speaker.documentList.length; i++) {
      keys.push(speaker.documentList[i].url);
    }

    deleteManyFiles(keys);

    return speaker;
  }

  async uploadAttachments(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    const speaker = await this.speakerModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const ext = getExtension(file.originalname);
    const random = nanoid(24);
    const url = `speakers/${userReq.owner ?? 'default'}/${speaker._id}/attachments/${random}.${ext}`;
    
    // move file to proper path
    await uploadFile({
      file: file,
      filePath: url,
      mimetype: file.mimetype
    });

    speaker.imageVideoList.push({
      name: filename || file.originalname,
      url: url,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await speaker.save();
    return result;
  }

  async uploadDocuments(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    const speaker = await this.speakerModel.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const ext = getExtension(file.originalname);
    const random = nanoid(24);
    const url = `speakers/${userReq.owner ?? 'default'}/${speaker._id}/documents/${random}.${ext}`;
    
    // move file to proper path
    await uploadFile({
      file: file,
      filePath: url,
      mimetype: file.mimetype
    });

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
    const speaker = await this.speakerModel.findById(id)
      .byTenant(userReq.owner)
      .select('imageVideoList')
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const fileObj = speaker.imageVideoList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_SPEAKER_FILE_NOT_FOUND);
    }

    fileObj.deleteFile();
    speaker.imageVideoList.pull(fileObj);

    const result = await speaker.save();
    return result;
  }

  async deleteDocuments(id: string, fileId: string, userReq: JwtUser) {
    const speaker = await this.speakerModel.findById(id)
      .byTenant(userReq.owner)
      .select('documentList')
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_NOT_FOUND))
      .exec();

    const fileObj = speaker.documentList.find(f => f['_id'] == fileId);
    if (!fileObj) {
      throw new BadRequestException(ErrCode.E_SPEAKER_FILE_NOT_FOUND);
    }

    fileObj.deleteFile();
    speaker.documentList.pull(fileObj);

    const result = await speaker.save();
    return result;
  }
}
