import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next } from '@nestjs/common'
import * as dayjs from 'dayjs'
import Express from 'express'
import { ResultType } from 'src/resource/database/entity/Record.entity'
import { StatusService } from 'src/service/status.service'

@Controller('v0/status')
export class StatusController {
  constructor (private readonly _statusService: StatusService) {
    
  }

  @Get()
  async getStatus (@Request() _request: Express.Request, @Response() _response: Express.Response, @Next() _next: Express.NextFunction) {
    try {
      const _groups = await this._statusService.getGroups()
      if(_groups.success == false) return _next(new Error('Failed to fetch groups.', { cause: _groups.error }))
      const statusColor: {
        [Type in ResultType]: 'Gray' | 'Green' | 'Yellow' | 'Orange' | 'Red' | 'Purple'
      } = {
        Success: 'Green',
        Maintenance: 'Purple',
        ReRouted: 'Orange',
        Delayed: 'Yellow',
        Timeout: 'Red',
        Failure: 'Red',
        Error: 'Red'
      }
      
      const _services = await Promise.all(_groups.groups.map(async _group => {
        return {
          ... _group,
          services: await (async () => {
            const _services = await this._statusService.getServicesWithColor(_group.id)
            return _services.success == true ? _services.services.map(_service => {
              return {
                ... _service,
                status: statusColor[_service.status],
                measuredDate: dayjs(_service.measuredDate).format('YYYY-MM-DD HH:mm:ssZ'),
                announcedMaintenances: _service.announcedMaintenances.map(_announcedMaintenance => {
                  return {
                    ... _announcedMaintenance,
                    startDate: dayjs(_announcedMaintenance.startDate).format('YYYY-MM-DD HH:mm:ssZ'),
                    endDate: dayjs(_announcedMaintenance.endDate).format('YYYY-MM-DD HH:mm:ssZ')
                  }
                })
              }
            }) : [  ]
          })()
        }
      }))

      let mainStatus = 'Green'

      if(JSON.stringify(_services).includes('Yellow') == true) mainStatus = 'Yellow'
      if(JSON.stringify(_services).includes('Purple') == true) mainStatus = 'Purple'
      if(JSON.stringify(_services).includes('Red') == true) mainStatus = 'Red'

      _response.status(200).json({ success: true, status: mainStatus, services: _services })
    } catch(_error) { console.log(_error); return _next() }
  }

  // @Put()
  // async createPayment (@Request() _request: Express.Request, @Response() _response: Express.Response, @Body() _body: { credentials: { username: string, password: string }, certifications: Array<string>, profile: { first_name: string, middle_name?: string, last_name: string, nickname: string, gender: 'male' | 'female', birthday: string } }, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
  //   try {
  //     _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })
  //   } catch(_error) { return _next() }
  // }
}
