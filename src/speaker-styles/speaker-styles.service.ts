import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { SPEAKER_STYLE } from 'src/commons/constants/schemaConst';
import { CreateSpeakerStylesDto } from './dto/create-speaker-style.dto';
import { SpeakerStylesDocument } from './entities/speaker-style.entity';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { UpdateSpeakerStyleDto } from './dto/update-speaker-style.dto';

@Injectable()
export class SpeakerStylesService {
  /**
   *
   */
  constructor(
    @InjectModel(SPEAKER_STYLE) private speakerStyleModel: Model<SpeakerStylesDocument>
  ) { }
  create(createSpeakerStyleDto: CreateSpeakerStylesDto, authUser: JwtUser) {
    return new this.speakerStyleModel(createSpeakerStyleDto)
      .withTenant(authUser.owner)
      .save();
  }

  async findAll(authUser: JwtUser) {
    var query = this.speakerStyleModel.find({});
    const [data] = await Promise.all([query.exec()]);
    return { data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.speakerStyleModel.findById(id)
        .byTenant(authUser.owner)
        .lean({ autopopulate: true })
        .orFail(new NotFoundException(ErrCode.E_SPEAKER_STYLE_NOT_FOUND))
        .exec();
  }

  update(id: string, updateSpeakerStyleDto: UpdateSpeakerStyleDto, authUser: JwtUser) {
    return this.speakerStyleModel.findByIdAndUpdate(id, updateSpeakerStyleDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_STYLE_NOT_FOUND))
      .exec();
  }

  async remove(id: string, userReq: JwtUser) {
    const speakerStyle = await this.speakerStyleModel.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_SPEAKER_STYLE_NOT_FOUND))
      .exec();
    
    return speakerStyle;
  }
}
