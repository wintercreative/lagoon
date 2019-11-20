import { Column, Entity } from 'typeorm';

@Entity('user_ssh_key', { schema: 'infrastructure' })
export class user_ssh_key {
  @Column('char', {
    nullable: false,
    primary: true,
    length: 36,
    name: 'usid'
  })
  usid: string;

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'skid'
  })
  skid: number;
}
