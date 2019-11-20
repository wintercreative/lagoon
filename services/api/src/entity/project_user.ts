import { Column, Entity } from 'typeorm';

@Entity('project_user', { schema: 'infrastructure' })
export class project_user {
  @Column('int', {
    nullable: false,
    primary: true,
    name: 'pid'
  })
  pid: number;

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'usid'
  })
  usid: number;
}
