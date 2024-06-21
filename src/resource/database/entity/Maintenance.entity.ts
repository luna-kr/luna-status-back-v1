import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum MaintenanceType { Periodic = 'Periodic', Irregular = 'Irregular', Emergency = 'Emergency' }
export enum MaintenanceStatus { Announced = 'Announced', Preparing = 'Preparing', Proceeding = 'Proceeding', Extended = 'Extended', Terminated = 'Terminated' }

@Entity()
export class Maintenance {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string


    @Column({ type: 'text', nullable: false, comment: 'Maintenance detail' })
    name: string

    @Column({ type: 'timestamptz', nullable: false, comment: 'Maintenance start date' })
    start_date: Date

    @Column({ type: 'timestamptz', nullable: false, comment: 'Maintenance end date' })
    end_date: Date

    @Column({ type: 'enum', enum: MaintenanceType, nullable: false, default: MaintenanceType.Irregular, comment: 'Maintenance type' })
    maintenance_type: MaintenanceType

    @Column({ type: 'text', nullable: false, comment: 'Maintenance effect' })
    effect: string


    @Column({ type: 'enum', enum: MaintenanceStatus, nullable: false, default: MaintenanceStatus.Announced, comment: 'Maintenance status' })
    status: MaintenanceStatus

    @Column({ type: 'uuid', array: true, nullable: false, comment: 'Service UUID' })
    service_id: Array<string>


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}