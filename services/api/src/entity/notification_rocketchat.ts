import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification_rocketchat', { schema: 'infrastructure' })
@Index('name', ['name'], { unique: true })
export class notification_rocketchat {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: true,
    unique: true,
    length: 50,
    name: 'name'
  })
  name: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'webhook'
  })
  webhook: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'channel'
  })
  channel: string | null;
}
