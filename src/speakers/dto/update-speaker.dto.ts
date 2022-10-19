import { PartialType } from '@nestjs/swagger';
import { CreateSpeakersDto } from './create-speaker.dto';

export class UpdateSpeakerDto extends PartialType(CreateSpeakersDto) {}
