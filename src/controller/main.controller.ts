import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next } from '@nestjs/common'
import * as dayjs from 'dayjs'
import Express from 'express'
import { AppService } from 'src/service/app.service'

@Controller()
export class AppController {
  constructor (private readonly _appService: AppService) {

  }

  @Get()
  async main (@Request() _request: Express.Request, @Response() _response: Express.Response, @Next() _next: Express.NextFunction) {
    return _response.status(200).json({ success: true, date: dayjs().format('YYYY-MM-DD HH:mm:ssZ') })
  }
}
