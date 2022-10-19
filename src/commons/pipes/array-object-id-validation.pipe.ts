import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isMongoId } from 'class-validator';

@Injectable()
export class ArrayObjectIdValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!Array.isArray(value)) {
      throw new BadRequestException('InvalidArray');
    }
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (!isMongoId(item)) {
        throw new BadRequestException({
          error: "Bad Request",
          message: "InvalidObjectId",
          detail: `${item} is invalid id`
        });
      }
    }
    return value;
  }
}
