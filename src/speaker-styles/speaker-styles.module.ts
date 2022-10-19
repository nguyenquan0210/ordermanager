import { Module } from '@nestjs/common';
import { SpeakerStylesService } from './speaker-styles.service';
import { SpeakerStylesController } from './speaker-styles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SpeakerStyleSchema } from './entities/speaker-style.entity';
import { SPEAKER_STYLE } from 'src/commons/constants/schemaConst';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SPEAKER_STYLE, schema: SpeakerStyleSchema }
    ])
  ],
  controllers: [SpeakerStylesController],
  providers: [SpeakerStylesService]
})

export class SpeakerStylesModule { }
