import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('backup_restore', { schema: 'infrastructure' })
@Index('backup_id', ['backup_id'], { unique: true })
export class backup_restore {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: true,
    unique: true,
    length: 300,
    name: 'backup_id'
  })
  backup_id: string | null;

  @Column('enum', {
    nullable: true,
    default: () => "'pending'",
    enum: ['pending', 'successful', 'failed'],
    name: 'status'
  })
  status: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'restore_location'
  })
  restore_location: string | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;
}
