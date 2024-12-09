import { Injectable } from '@nestjs/common'
import utilityPlugin from 'src/resource/plugin/utility.plugin'
import { ArrayContains, EntityManager } from 'typeorm'
import { Group } from 'src/resource/database/entity/Group.entity'
import { MeasureMethod, Service } from 'src/resource/database/entity/Service.entity'
import ping from 'ping'
import { Record, ResultType } from 'src/resource/database/entity/Record.entity'
import { Maintenance, MaintenanceStatus, MaintenanceType } from 'src/resource/database/entity/Maintenance.entity'

@Injectable()
export class StatusService {

    constructor (
      private readonly _entityManager: EntityManager,
    ) {  }

    public async getGroups (): Promise<{ success: true, groups: Array<{ id: string, name: string }> } | { success: false, error? :Error }> {
        try {
            const _groups = await this._entityManager.getRepository(Group).find({ where: { is_active: true }, order: { srl: 'asc' } })
            return { success: true, groups: _groups.map(_group => { return { id: _group.uuid, name: _group.name } }) }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async createGroup (_name: string): Promise<{ success: true, id: string } | { success: false, error?: Error }> {
        try {
            const _Group = new Group()
            _Group.name = _name
            const _group = await this._entityManager.save(_Group)
            return { success: true, id: _group.uuid }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async getServices (_uuid: string): Promise<{ success: true, services: Array<{ id: string, name: string, type: MeasureMethod, hostname: string }> } | { success: false, error?: Error }> {
        try {
            if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(_uuid) == false) throw new Error('Invalid group id.')
            const _services = await this._entityManager.getRepository(Service).find({ where: { group_id: _uuid, is_active: true }, order: { srl: 'desc' } })
            return { success: true, services: _services.map(_service => { return { id: _service.uuid, name: _service.name, hostname: _service.name, type: _service.measure_method } }) }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async getServicesWithColor (_uuid: string): Promise<{ success: true, services: Array<{ id: string, name: string, type: MeasureMethod, status: ResultType, measuredDate: Date, announcedMaintenances: Array<{ id: string, name: string, startDate: Date, endDate: Date, type: MaintenanceType, status: MaintenanceStatus }> }> } | { success: false, error?: Error }> {
        try {
            if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(_uuid) == false) throw new Error('Invalid group id.')
            const _services = await this._entityManager.getRepository(Service).find({ where: { group_id: _uuid, is_active: true }, order: { srl: 'desc' } })
            
            return { success: true, services: await Promise.all(_services.map(async _service => {
                const _records = await this._entityManager.getRepository(Record).find({ where: { service_id: _service.uuid, is_active: true }, order: { srl: 'desc' }, take: 1 })
                const _maintenances = await this.getServiceMaintenances(_service.uuid)
                let _announcedMaintenances: Array<{ id: string, name: string, startDate: Date, endDate: Date, type: MaintenanceType, status: MaintenanceStatus }> = [  ]
                if(_maintenances.success == true) {
                    _announcedMaintenances = _maintenances.maintenances.filter(_maintenance => _maintenance.status !== MaintenanceStatus.Terminated)
                    if(_maintenances.maintenances.filter(_maintenance => [ MaintenanceStatus.Proceeding, MaintenanceStatus.Extended ].includes(_maintenance.status)).length !== 0) {
                        return { id: _service.uuid, name: _service.name, type: _service.measure_method, status: ResultType.Maintenance, measuredDate: new Date(), announcedMaintenances: _announcedMaintenances }
                    }
                }
                return { id: _service.uuid, name: _service.name, type: _service.measure_method, status: _records[0].result, measuredDate: _records[0].created_date, announcedMaintenances: _announcedMaintenances }
            })) }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async addService (_uuid: string, _name: string, _measureMethod: MeasureMethod, _interval: number, _config: { type: MeasureMethod.PING, hostname: string, timeout: number, delayCriteria: number, isPop: boolean }): Promise<{ success: true, id: string } | { success: false, error?: Error }> {
        try {
            if(_config.type !== _measureMethod) throw new Error('Invalid config.')
            if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(_uuid) == false) throw new Error('Invalid group id.')
            const _groups = await this._entityManager.getRepository(Group).find({ where: { uuid: _uuid, is_active: true } })
            if(_groups.length !== 1) throw new Error('Wrong group id.')
        
            const _Service = new Service()
            _Service.name = _name
            _Service.measure_method = _measureMethod
            _Service.PING_config = _measureMethod == MeasureMethod.PING ? {
                hostname: _config.hostname,
                timeout: _config.timeout,
                delay_criteria: _config.delayCriteria,
                is_pop: _config.isPop
            } : null
            _Service.measure_interval = _interval
            _Service.group_id = _groups[0].uuid
            
            const _service = await this._entityManager.save(_Service)

            return { success: true, id: _service.uuid }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async getStatus (_uuid: string): Promise<{ success: true, isAlive: boolean } | { success: false, error?: Error }> {
        try {
            if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(_uuid) == false) throw new Error('Invalid service id.')
            const _services = await this._entityManager.getRepository(Service).find({ where: { uuid: _uuid } })
            if(_services.length !== 1) throw new Error('Wrong service id.')
            try {
                switch(_services[0].measure_method) {
                    case MeasureMethod.PING:
                        const _result = await ping.promise.probe(_services[0].PING_config.hostname, {
                            timeout: _services[0].PING_config.timeout
                        })
                        const _Record = new Record()
                        _Record.service_id = _services[0].uuid
                        _Record.target = _services[0].PING_config.hostname
                        _Record.latency = String(_result.times[0])
                        _Record.result = _result.alive ? ( _result.times[0] >= _services[0].PING_config.delay_criteria ? ResultType.Delayed : ResultType.Success ) : (_services[0].PING_config.is_pop ? ResultType.ReRouted : ResultType.Timeout)
                        await this._entityManager.save(_Record)
                        return { success: true, isAlive: _result.alive }
                }
            } catch(_error) { throw new Error('Failed to measure.', { cause: _error }) }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async getMaintenances (): Promise<{ success: true, maintenances: Array<{ id: string, name: string, startDate: Date, endDate: Date, type: MaintenanceType, effect: string, status: MaintenanceStatus }> } | { success: false, error?: Error }> {
        try {
            const _maintenances = await this._entityManager.getRepository(Maintenance).find({ where: { is_active: true }, order: { start_date: 'asc' } })
            return { success: true, maintenances: _maintenances.map(_maintenance => { return { id: _maintenance.uuid, name: _maintenance.name, startDate: _maintenance.start_date, endDate: _maintenance.end_date, type: _maintenance.maintenance_type, effect: _maintenance.effect, status: _maintenance.status } }) }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async getServiceMaintenances (_uuid: string): Promise<{ success: true, maintenances: Array<{ id: string, name: string, startDate: Date, endDate: Date, type: MaintenanceType, effect: string, status: MaintenanceStatus }> } | { success: false, error?: Error }> {
        try {
            if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(_uuid) == false) throw new Error('Invalid service id.')
            const _maintenances = await this._entityManager.getRepository(Maintenance).find({ where: { service_id: ArrayContains([ _uuid ]), is_active: true }, order: { start_date: 'asc' } })
            return { success: true, maintenances: _maintenances.map(_maintenance => { return { id: _maintenance.uuid, name: _maintenance.name, startDate: _maintenance.start_date, endDate: _maintenance.end_date, type: _maintenance.maintenance_type, effect: _maintenance.effect, status: _maintenance.status } }) }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async createMaintenance (_uuid: string, _name: string, _startDate: Date, _endDate: Date, _type: MaintenanceType) {
        try {
            
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async updateMaintenance (_uuid: string, _name: string, _startDate: Date, _endDate: Date) {
        try {
            
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }

    public async deleteMaintenance (_uuid: string, _name: string, _startDate: Date, _endDate: Date) {
        try {
            
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }
}
