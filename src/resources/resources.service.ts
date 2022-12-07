import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { CHECK_SIZE_FILE, LEVEL_ACCOUNT } from 'src/commons/constants/envConstanst';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { filterParams } from 'src/commons/utils/filterParams';
import { getExtension } from 'src/commons/utils/getExtension';
import { deleteFile, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { S3FileDocument } from 'src/storages/s3File.schema';
import { CreateResourceDto } from './dto/create-resource.dto';
import { QueryResource } from './dto/query-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { UpdateS3FileDto } from './dto/update-s3file.dto';
import { Resource, ResourceDocument } from './entities/resource.entity';
import { ResourceType } from './inteface/resourceType';
import { LevelAccount } from 'src/users/interface/userRoles';
import { fs } from 'file-system';
@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private model: Model<ResourceDocument>
  ) { }

  create(createResourceDto: CreateResourceDto, authUser: JwtUser) {
    const doc = new this.model(createResourceDto)
      .withTenant(authUser.owner);
    doc.createdBy = authUser.userId;
    return doc.save();
  }

  async findAll(authUser: JwtUser, query: Paginate & QueryResource) {
    let filter: FilterQuery<ResourceDocument> = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    const cond = filterParams(query, ['category', 'type']);

    const cmd = this.model.find({ ...filter, ...cond })
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })

    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }
    const totalCmd = this.model.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.model.findById(id)
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_NOT_FOUND))
      .exec();
  }

  update(id: string, updateResourceDto: UpdateResourceDto, authUser: JwtUser) {
    return this.model.findByIdAndUpdate(id, updateResourceDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_NOT_FOUND))
      .exec();
  }

  async remove(id: string, authUser: JwtUser) {
    const result = await this.model.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_NOT_FOUND))
      .exec();

    if (result.files) {
      for (const file of result.files) {
        file.deleteFile();
      }
    }
    return result.delete();
  }

  getFileType(mimetype: string) {
    if (mimetype.indexOf('image') != -1) return 'IMG';
    if (mimetype.indexOf('video') != -1) return 'VIDEO';
    if (mimetype.indexOf('audio') != -1) return 'AUDIO';
    return 'FILE';
  }

  async uploadFile(id: string, file: Express.Multer.File, userReq: JwtUser, filename?: string) {
    const types = this.getFileType(file.mimetype)
    if(file.size > CHECK_SIZE_FILE[types]){
      throw new BadRequestException(ErrCode.E_UPLOAD_FILE);
    }
    const size = await this.getTotalSize(userReq);

    if(size > LEVEL_ACCOUNT[userReq.levelAccount|| LevelAccount.FREE].SIZE_FILE){
      throw new BadRequestException(ErrCode.E_OUT_OF_MEMORY);
    } 
    
    const doc = await this.model.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_NOT_FOUND))
      .exec();

    const ext = getExtension(file.originalname);
    const random = nanoid(24) + `${ext ? `.${ext}` : ''}`;
    const url = `resources/${userReq.owner ?? 'default'}/${doc.type}/${doc._id}/${random}`;

    // move file to proper path
    await uploadFile({
      file: file,
      filePath: url,
      mimetype: file.mimetype
    })
    if (!doc.files) { doc.files = []; }

    doc.files.push({
      name: filename || file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url
    });

    doc.size = doc.files.reduce((acc, cur)=>{
      return acc + cur.size;
    }, 0)

    return doc.save();
  }

  async removeFile(id: string, fileId: string, userReq: JwtUser) {
    const doc = await this.model.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_NOT_FOUND))
      .exec();

    const file = doc.files.find(f => f['_id'].equals(fileId)) as S3FileDocument;
    if (file) {
      file.deleteFile();
      file.remove();
      await doc.save();
    }

    doc.size = doc.files.reduce((acc, cur)=>{
      return acc + cur.size;
    }, 0)

    return doc.save();
  }

  async updateFileInfo(id: string, fileId: string, info: UpdateS3FileDto, userReq: JwtUser) {
    const doc = await this.model.findById(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_RESOURCE_NOT_FOUND))
      .exec();

    const file = doc.files.find(f => f['_id'].equals(fileId)) as S3FileDocument;
    if (file) {
      file.set(info);
      await doc.save();
    }

    return doc;
  }

  getSignedUrl(id: string, owner: string, type: string, fileName: string) {
    const key = `resources/${owner}/${type}/${id}/${fileName}`;
    return signedUrl(key);
  }


  async createAndUploadFile(file: Express.Multer.File, userReq: JwtUser, type: ResourceType, name: string, filename?: string) {

    if(type == ResourceType.Image && file.size > CHECK_SIZE_FILE.IMG){
      throw new BadRequestException(ErrCode.E_UPLOAD_FILE);
    }else if(type == ResourceType.Video && file.size > CHECK_SIZE_FILE.VIDEO){
      throw new BadRequestException(ErrCode.E_UPLOAD_FILE);
    }else if(type == ResourceType.Audio && file.size > CHECK_SIZE_FILE.AUDIO){
      throw new BadRequestException(ErrCode.E_UPLOAD_FILE);
    }else if(type == ResourceType.File && file.size > CHECK_SIZE_FILE.FILE){
      throw new BadRequestException(ErrCode.E_UPLOAD_FILE);
    }
    
    const doc = new this.model({ name, type })
      .withTenant(userReq.owner);
    doc.createdBy = userReq.userId;

    const ext = getExtension(file.originalname);
    const random = nanoid(24) + `${ext ? `.${ext}` : ''}`;
    const url = `resources/${userReq.owner ?? 'default'}/${doc.type}/${doc._id}/${random}`;
    console.log(file)
    // move file to proper path
    // await uploadFile({
    //   file: file,
    //   filePath: url,
    //   mimetype: file.mimetype
    // })
    var img = fs.readFileSync(file.path);
    console.log(img)
    var encode_image = img.toString('base64');
    console.log(encode_image)
  //   var finalImg = {
  //     contentType: file.mimetype,
  //     image: Buffer.from(encode_image, 'base64')
  // };
    if (!doc.files) { doc.files = []; }

    const result = {
      name: filename || file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url
    }
    doc.files.push({...result});

    doc.size = doc.files.reduce((acc, cur)=>{
      return acc + cur.size;
    }, 0)
    
    doc.save();
    return result;
  }

  async getTotalSize(authUser: JwtUser) {
    
    const doc = await this.model.aggregate([
      { $match: 
        { owner: mongoose.Types.ObjectId(authUser.owner) }
      },
      { $group: { _id : null, sum : { $sum: "$size" } } }])
    const result = doc[0]?.sum || 0;      
    return result;
  }
}
