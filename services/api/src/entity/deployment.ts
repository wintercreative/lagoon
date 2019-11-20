import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('deployment', { schema: 'infrastructure' })
export class deployment {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: false,
    length: 100,
    name: 'name'
  })
  name: string;

  @Column('enum', {
    nullable: false,
    enum: [
      'new',
      'pending',
      'running',
      'cancelled',
      'error',
      'failed',
      'complete'
    ],
    name: 'status'
  })
  status: string;

  @Column('datetime', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;

  @Column('datetime', {
    nullable: true,
    name: 'started'
  })
  started: Date | null;

  @Column('datetime', {
    nullable: true,
    name: 'completed'
  })
  completed: Date | null;

  @Column('int', {
    nullable: false,
    name: 'environment'
  })
  environment: number;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'remote_id'
  })
  remote_id: string | null;
}
