import { Module } from '@nestjs/common';
import { AppController } from '../controller/main.controller';
import { AppService } from '../service/app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { typeOrmConfig } from 'src/resource/config/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import { StatusModule } from '../module/status.module'

@Module({
  imports: [ ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(typeOrmConfig as TypeOrmModuleOptions), StatusModule ],
  controllers: [ AppController ],
  providers: [ AppService ],
})
export class AppModule {  }
