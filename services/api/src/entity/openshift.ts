import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('openshift', { schema: 'infrastructure' })
@Index('name', ['name'], { unique: true })
export class openshift {
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
    name: 'console_url'
  })
  console_url: string | null;

  @Column('varchar', {
    nullable: true,
    length: 1000,
    name: 'token'
  })
  token: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'router_pattern'
  })
  router_pattern: string | null;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'project_user'
  })
  project_user: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'ssh_host'
  })
  ssh_host: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'ssh_port'
  })
  ssh_port: string | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;
}
