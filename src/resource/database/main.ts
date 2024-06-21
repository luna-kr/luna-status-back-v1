import { DataSource, DataSourceOptions } from 'typeorm'
import { typeOrmConfig } from '../config/typeorm.config'

let _client: DataSource | null = null
export function getDatabaseClient () {
    if(_client == null) throw 'Database is not initialized.'
    else return _client
}
export async function connectDatabase () {
    return _client = await (new DataSource(typeOrmConfig as DataSourceOptions)).initialize()
}