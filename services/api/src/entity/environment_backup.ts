import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('environment_backup', { schema: 'infrastructure' })
@Index('backup_id', ['backup_id'], { unique: true })
@Index('backup_environment', ['environment'])
export class environment_backup {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('int', {
    nullable: true,
    name: 'environment'
  })
  environment: number | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'source'
  })
  source: string | null;

  @Column('varchar', {
    nullable: true,
    unique: true,
    length: 300,
    name: 'backup_id'
  })
  backup_id: string | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;

  @Column('timestamp', {
    nullable: false,
    default: () => "'0000-00-00 00:00:00'",
    name: 'deleted'
  })
  deleted: Date;
}
