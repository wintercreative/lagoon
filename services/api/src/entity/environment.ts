import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('environment', { schema: 'infrastructure' })
@Index('project_name_deleted', ['project', 'name', 'deleted'], { unique: true })
export class environment {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'name'
  })
  name: string | null;

  @Column('int', {
    nullable: true,
    name: 'project'
  })
  project: number | null;

  @Column('enum', {
    nullable: false,
    enum: ['branch', 'pullrequest', 'promote'],
    name: 'deploy_type'
  })
  deploy_type: string;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'deploy_base_ref'
  })
  deploy_base_ref: string | null;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'deploy_head_ref'
  })
  deploy_head_ref: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'deploy_title'
  })
  deploy_title: string | null;

  @Column('enum', {
    nullable: false,
    enum: ['production', 'development'],
    name: 'environment_type'
  })
  environment_type: string;

  @Column('int', {
    nullable: false,
    default: () => "'1'",
    name: 'auto_idle'
  })
  auto_idle: number;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'openshift_project_name'
  })
  openshift_project_name: string | null;

  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'route'
  })
  route: string | null;

  @Column('text', {
    nullable: true,
    name: 'routes'
  })
  routes: string | null;

  @Column('text', {
    nullable: true,
    name: 'monitoring_urls'
  })
  monitoring_urls: string | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated'
  })
  updated: Date;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;

  @Column('timestamp', {
    nullable: false,
    default: () => "'0000-00-00 00:00:00'",
    name: 'deleted'
  })
  deleted: Date;
}
