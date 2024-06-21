import { NestFactory } from '@nestjs/core'
import { AppModule } from './module/app.module'
import * as dotenv from 'dotenv'
import queuePlugin from './resource/plugin/queue.plugin'
import { connectDatabase } from './resource/database/main'
import { ConfigModule } from '@nestjs/config'

async function bootstrap () {
  dotenv.config()
 
  console.log(process.env.DB_TYPE)
  const app = await NestFactory.create(AppModule, { cors: { origin: '*' } });
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(4000)
  connectDatabase().then(() => {
    setInterval(queuePlugin.measure, 100)
  })
}
bootstrap()
