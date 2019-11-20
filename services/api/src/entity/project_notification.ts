import { Column, Entity } from 'typeorm';

@Entity('project_notification', { schema: 'infrastructure' })
export class project_notification {
  @Column('int', {
    nullable: false,
    primary: true,
    name: 'nid'
  })
  nid: number;

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'pid'
  })
  pid: number;

  @Column('enum', {
    nullable: false,
    primary: true,
    enum: ['slack', 'rocketchat'],
    name: 'type'
  })
  type: string;
}
