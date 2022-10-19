import {
    BadRequestException, ConflictException, NotFoundException, Injectable,
} from '@nestjs/common';
import { isString, isNumber, isArray, isBoolean } from 'class-validator';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { getSlug } from 'src/commons/utils/getSlug';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributeDocument } from './entities/attribute.entity';
import { AttributeDefine } from './interface/attributeDefine';
import { AttrValueType } from './interface/attrValueType';

@Injectable()
export class AttributesDynamicService {

    #model: Model<AttributeDocument>;
    constructor(model: Model<AttributeDocument>) {
        this.#model = model;
    }

    private getModel() {
        return this.#model;
    }

    async create(createAttributeDto: CreateAttributeDto, userReq: JwtUser) {
        const model = this.getModel();
        const doc = new model(createAttributeDto)
            .withTenant(userReq.owner);
        doc.keyName = getSlug(doc.name);

        const exist = await model.findOne({ keyName: doc.keyName })
            .byTenant(userReq.owner)
            .lean()
            .exec();
        if (exist) {
            throw new ConflictException("AttributeSimilar")
        }
        return doc.save();
    }

    findAll(userReq: JwtUser, query: { isRequired?: boolean }) {
        const model = this.getModel();
        const filter: FilterQuery<AttributeDocument> = {}
        if (query.isRequired !== undefined) {
            filter.isRequired = query.isRequired;
        }
        return model.find(filter)
            .byTenant(userReq.owner)
            .lean()
            .exec();
    }

    findAllRequired(userReq?: JwtUser) {
        const model = this.getModel();
        return model.find({ isRequired: true })
            .byTenant(userReq?.owner)
            .lean()
            .exec();
    }

    findOne(id: string, userReq?: JwtUser) {
        const model = this.getModel();
        return model.findById(id)
            .byTenant(userReq?.owner)
            .lean()
            .orFail(new NotFoundException(ErrCode.E_ATTRIBUTE_NOT_FOUND))
            .exec();
    }

    update(id: string,
        updateAttributeDto: UpdateAttributeDto,
        userReq: JwtUser) {
        const model = this.getModel();
        return model.findByIdAndUpdate(id, updateAttributeDto, { new: true })
            .byTenant(userReq.owner)
            .orFail(new NotFoundException(ErrCode.E_ATTRIBUTE_NOT_FOUND))
            .exec();
    }

    remove(id: string, userReq: JwtUser) {
        const model = this.getModel();
        return model.findByIdAndDelete(id)
            .byTenant(userReq.owner)
            .orFail(new NotFoundException(ErrCode.E_ATTRIBUTE_NOT_FOUND))
            .exec();
    }

    private validateValueType(valueType: AttrValueType, value: any) {
        switch (valueType) {
            case AttrValueType.string:
                return isString(value);
            case AttrValueType.number:
                return isNumber(value);
            case AttrValueType.boolean:
                return isBoolean(value);
            case AttrValueType.array_number:
                return isArray(value) && (value as []).every(it => isNumber(it));
            case AttrValueType.array_string:
                return isArray(value);
            default:
                return false;
        }
    }

    async validateAttribute(attrInfo: AttributeDefine) {
        if (!attrInfo.attribute) {
            throw new BadRequestException("MissingAttributeId");
        }
        const defAttribute = await this.findOne(attrInfo.attribute);
        const valueType = defAttribute.valueType;
        const valid = this.validateValueType(valueType, attrInfo.value);
        if (!valid) {
            throw new BadRequestException({
                error: "Bad Request",
                message: ErrCode.E_ATTRIBUTE_INVALID_TYPE,
                detail: `${defAttribute.name} must be a ${valueType}`
            });
        }
        return valid;
    }
}