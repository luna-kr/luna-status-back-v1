import { Module } from '@nestjs/common';
import { typeOrmConfig } from 'src/resource/config/typeorm.config';
import { StatusController } from 'src/controller/status.controller';
import { StatusService } from 'src/service/status.service';

@Module({
  imports: [  ],
  controllers: [ StatusController ],
  providers: [ StatusService ],
})
export class StatusModule {  }