import { Record, ResultType } from "../database/entity/Record.entity"
import { MeasureMethod, Service } from "../database/entity/Service.entity"
import { getDatabaseClient } from "../database/main"
import * as dayjs from 'dayjs'
import { promise } from 'ping'

export default {
    pluginName: 'queuePlugin',

    measure: async function () {
        try {
            const _services = await getDatabaseClient().manager.getRepository(Service).find({ where: { is_active: true } })
            const _requiredServices = _services.filter(_service => { return dayjs(_service.recent_measure_date ?? new Date('2000-01-01 00:00:00Z')).add(_service.measure_interval, 'milliseconds').diff() <= 0 })
            for(const _service of _requiredServices) {
                switch (_service.measure_method) {
                    case MeasureMethod.PING:
                        promise.probe(_service.PING_config.hostname, {
                            timeout: _service.PING_config.timeout / 1000
                        }).then(async _result => {
                            const _Record = new Record()
                            _Record.service_id = _service.uuid
                            _Record.target = _service.PING_config.hostname
                            _Record.latency = String(_result.times[0])
                            _Record.result = _result.alive ? ( _result.times[0] >= _service.PING_config.delay_criteria ? ResultType.Delayed : ResultType.Success ) : (_service.PING_config.is_pop ? ResultType.ReRouted : ResultType.Timeout)
                            await getDatabaseClient().manager.save(_Record)
                            await getDatabaseClient().manager.getRepository(Service).update({ uuid: _service.uuid, is_active: true }, { recent_measure_date: new Date() })
                        })
                    break
                }
            }
        } catch(_error) {
            console.error(_error)
            console.error('Failed to measure services.')
        }
    }
}