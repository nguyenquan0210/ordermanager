import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class FileUploadDto {
  @ApiProperty({ type: 'string',required: false, format: 'binary' })
  file: any;
}

export class FileFieldNameDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
  @ApiProperty({ type: 'string', required: false, description: 'custom filename' })
  name: string;
  @ApiProperty({ type: 'string', required: false, description: 'custom filename' })
  description: string;
}

export class FileBodyDto {
  @IsString()
  name: string;
  @IsString()
  description: string;
}
