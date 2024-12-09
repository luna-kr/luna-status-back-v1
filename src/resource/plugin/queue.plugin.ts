import { Record, ResultType } from "../database/entity/Record.entity"
import { MeasureMethod, Service } from "../database/entity/Service.entity"
import { getDatabaseClient } from "../database/main"
import * as dayjs from 'dayjs'
import { promise } from 'ping'
import notificationPlugin from "./notification.plugin"
import { Maintenance, MaintenanceStatus } from "../database/entity/Maintenance.entity"
import { ArrayContains } from "typeorm"

export default {
    pluginName: 'queuePlugin',

    measure: async function () {
        try {
            const _services = await getDatabaseClient().manager.getRepository(Service).find({ where: { is_active: true } })
            const _requiredServices = _services.filter(_service => { return dayjs(_service.recent_measure_date ?? new Date('2000-01-01 00:00:00Z')).add(_service.measure_interval, 'milliseconds').diff() <= 0 })
            for(const _service of _requiredServices) {
                let _isMaintenance = false
                const _maintenances = await getDatabaseClient().manager.getRepository(Maintenance).find({ where: { service_id: ArrayContains([ _service.uuid ]), status: MaintenanceStatus.Proceeding, is_active: true } })
                if(_maintenances.length !== 0) _isMaintenance = true
                switch (_service.measure_method) {
                    case MeasureMethod.PING:
                        promise.probe(_service.PING_config.hostname, {
                            timeout: _service.PING_config.timeout / 1000
                        }).then(async _result => {
                            const _Record = new Record()
                            _Record.service_id = _service.uuid
                            _Record.target = _service.PING_config.hostname
                            _Record.latency = String(_result.times[0])
                            _Record.result = _isMaintenance ? ResultType.Maintenance : (_result.alive ? ( _result.times[0] >= _service.PING_config.delay_criteria ? ResultType.Delayed : ResultType.Success ) : (_service.PING_config.is_pop ? ResultType.ReRouted : ResultType.Timeout))
                            const _record = await getDatabaseClient().manager.save(_Record)
                            await getDatabaseClient().manager.getRepository(Service).update({ uuid: _service.uuid, is_active: true }, { recent_measure_date: new Date() })

                            const _lastService = await getDatabaseClient().manager.getRepository(Service).find({ where: { uuid: _service.uuid } })

                            if(_service.recent_notificated_date == null || dayjs().diff(_lastService[0].recent_notificated_date) >= 5 * 60 * 1000) {
                                switch (_record.result) {
                                    case ResultType.Delayed:
                                        // await notificationPlugin.Notification.SMTP.send(process.env.EMAIL_ADDRESS, '[루나 네트워크] 서비스 지연 알림', `아래 서비스의 지연이 발생하였습니다.<br>${ _service.name }`)
                                        await getDatabaseClient().manager.getRepository(Service).update({ uuid: _service.uuid, is_active: true }, { recent_notificated_date: new Date() })
                                        if(dayjs().diff(_lastService[0].recent_notificated_date) >= 60 * 60 * 1000) {
                                            // await notificationPlugin.Notification.SMS.send(process.env.PHONE_NUMBER, `[루나 네트워크] 서비스 지연 알림\n아래 서비스의 지연이 발생하였습니다.\n${ _service.name }`)
                                        }
                                        break
                                    case ResultType.Failure:
                                    case ResultType.Error:
                                        // await notificationPlugin.Notification.SMTP.send(process.env.EMAIL_ADDRESS, '[루나 네트워크] 서비스 오류 알림', `아래 서비스의 오류가 발생하였습니다.<br>${ _service.name }`)
                                        await getDatabaseClient().manager.getRepository(Service).update({ uuid: _service.uuid, is_active: true }, { recent_notificated_date: new Date() })
                                        if(dayjs().diff(_lastService[0].recent_notificated_date) >= 60 * 60 * 1000) {
                                            // await notificationPlugin.Notification.SMS.send(process.env.PHONE_NUMBER, `[루나 네트워크] 서비스 지연 알림\n아래 서비스의 지연이 발생하였습니다.\n${ _service.name }`)
                                        }
                                        break
                                    case ResultType.ReRouted:
                                        // await notificationPlugin.Notification.SMTP.send(process.env.EMAIL_ADDRESS, '[루나 네트워크] 서비스 Re-route 알림', `아래 서비스의 Re-route가 발생하였습니다.<br>${ _service.name }`)
                                        await getDatabaseClient().manager.getRepository(Service).update({ uuid: _service.uuid, is_active: true }, { recent_notificated_date: new Date() })
                                        if(dayjs().diff(_lastService[0].recent_notificated_date) >= 60 * 60 * 1000) {
                                            // await notificationPlugin.Notification.SMS.send(process.env.PHONE_NUMBER, `[루나 네트워크] 서비스 지연 알림\n아래 서비스의 지연이 발생하였습니다.\n${ _service.name }`)
                                        }
                                        break
                                    case ResultType.Timeout:
                                        // await notificationPlugin.Notification.SMTP.send(process.env.EMAIL_ADDRESS, '[루나 네트워크] 서비스 다운 알림', `아래 서비스의 다운이 발생하였습니다.<br>${ _service.name }`)
                                        await getDatabaseClient().manager.getRepository(Service).update({ uuid: _service.uuid, is_active: true }, { recent_notificated_date: new Date() })
                                        if(dayjs().diff(_lastService[0].recent_notificated_date) >= 60 * 60 * 1000) {
                                            // await notificationPlugin.Notification.SMS.send(process.env.PHONE_NUMBER, `[루나 네트워크] 서비스 지연 알림\n아래 서비스의 지연이 발생하였습니다.\n${ _service.name }`)
                                        }
                                        break
                                }
                            }
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