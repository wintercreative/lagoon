import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task', { schema: 'infrastructure' })
export class task {
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

  @Column('int', {
    nullable: false,
    name: 'environment'
  })
  environment: number;

  @Column('varchar', {
    nullable: false,
    length: 100,
    name: 'service'
  })
  service: string;

  @Column('text', {
    nullable: false,
    name: 'command'
  })
  command: string;

  @Column('enum', {
    nullable: false,
    enum: ['active', 'succeeded', 'failed'],
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

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'remote_id'
  })
  remote_id: string | null;
}
