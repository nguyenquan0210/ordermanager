import { PartialType } from '@nestjs/swagger';
import { CreateSpeakerStylesDto } from './create-speaker-style.dto';

export class UpdateSpeakerStyleDto extends PartialType(CreateSpeakerStylesDto) {}
