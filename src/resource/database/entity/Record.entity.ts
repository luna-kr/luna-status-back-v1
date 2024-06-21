import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum ResultType { Success = 'Success', Maintenance = 'Maintenance', ReRouted = 'ReRouted', Delayed = 'Delayed', Timeout = 'Timeout', Failure = 'Failure', Error = 'Error' }

@Entity()
export class Record {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string


    @Column({ type: 'uuid', nullable: false, comment: 'Service id' })
    service_id: string
    
    @Column({ type: 'text', nullable: false, comment: 'Measure target' })
    target: string

    @Column({ type: 'enum', enum: ResultType, nullable: false, comment: 'Result' })
    result: ResultType

    @Column({ type: 'varchar', length: 10, nullable: true, default: null, comment: 'Latency (ms)' })
    latency: string | null


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}