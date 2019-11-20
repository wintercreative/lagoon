import { Column, Entity } from 'typeorm';

@Entity('task_file', { schema: 'infrastructure' })
export class task_file {
  @Column('int', {
    nullable: false,
    primary: true,
    name: 'tid'
  })
  tid: number;

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'fid'
  })
  fid: number;
}
