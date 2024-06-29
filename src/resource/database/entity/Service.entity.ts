import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum MeasureMethod { PING = 'PING' }

@Entity()
export class Service {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string


    @Column({ type: 'varchar', length: 30, nullable: true, default: null, comment: 'Coupon code' })
    name: string

    @Column({ type: 'enum', enum: MeasureMethod, nullable: false, default: MeasureMethod.PING, comment: 'Service check method' })
    measure_method: MeasureMethod
    
    @Column({ type: 'jsonb', nullable: true, default: null, comment: 'CheckMethod: PING / Config' })
    PING_config: {
        hostname: string,
        timeout: number,
        delay_criteria: number,
        is_pop: boolean
    }

    @Column({ type: 'int', nullable: false, comment: 'Measure interval' })
    measure_interval: number

    @Column({ type: 'uuid', nullable: false, comment: 'Group UUID' })
    group_id: string

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Recent measure date' })
    recent_measure_date: Date | null


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}