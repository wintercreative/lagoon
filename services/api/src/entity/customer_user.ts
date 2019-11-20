import { Column, Entity } from 'typeorm';

@Entity('customer_user', { schema: 'infrastructure' })
export class customer_user {
  @Column('int', {
    nullable: false,
    primary: true,
    name: 'cid'
  })
  cid: number;

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'usid'
  })
  usid: number;
}
