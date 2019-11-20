import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('project', { schema: 'infrastructure' })
@Index('name', ['name'], { unique: true })
export class project {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: true,
    unique: true,
    length: 100,
    name: 'name'
  })
  name: string | null;

  @Column('int', {
    nullable: true,
    name: 'customer'
  })
  customer: number | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'git_url'
  })
  git_url: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'availability'
  })
  availability: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'subfolder'
  })
  subfolder: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_deploy'
  })
  active_systems_deploy: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_promote'
  })
  active_systems_promote: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_remove'
  })
  active_systems_remove: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_task'
  })
  active_systems_task: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'branches'
  })
  branches: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'pullrequests'
  })
  pullrequests: string | null;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'production_environment'
  })
  production_environment: string | null;

  @Column('int', {
    nullable: false,
    default: () => "'1'",
    name: 'auto_idle'
  })
  auto_idle: number;

  @Column('int', {
    nullable: false,
    default: () => "'1'",
    name: 'storage_calc'
  })
  storage_calc: number;

  @Column('int', {
    nullable: true,
    name: 'openshift'
  })
  openshift: number | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'openshift_project_pattern'
  })
  openshift_project_pattern: string | null;

  @Column('int', {
    nullable: true,
    name: 'development_environments_limit'
  })
  development_environments_limit: number | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;

  @Column('varchar', {
    nullable: true,
    length: 5000,
    name: 'private_key'
  })
  private_key: string | null;
}
