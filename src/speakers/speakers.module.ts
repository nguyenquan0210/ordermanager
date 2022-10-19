import { Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Speakers, SpeakersSchema } from './entities/speaker.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Speakers.name, useFactory: () => SpeakersSchema }
    ])
  ],
  controllers: [SpeakersController],
  providers: [SpeakersService]
})

export class SpeakersModule { }
