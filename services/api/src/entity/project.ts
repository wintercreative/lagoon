import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  BaseEntity
} from 'typeorm';
import { ObjectType, Field, ID, Root, Int } from 'type-graphql';

@ObjectType()
@Entity('project', { schema: 'infrastructure' })
@Index('name', ['name'], { unique: true })
export class Project extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    unique: true,
    length: 100,
    name: 'name'
  })
  name: string;

  @Field(() => Int)
  @Column('int', {
    nullable: true,
    name: 'customer'
  })
  customer: number | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'git_url'
  })
  git_url: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'availability'
  })
  availability: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'subfolder'
  })
  subfolder: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_deploy'
  })
  active_systems_deploy: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_promote'
  })
  active_systems_promote: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_remove'
  })
  active_systems_remove: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'active_systems_task'
  })
  active_systems_task: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'branches'
  })
  branches: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'pullrequests'
  })
  pullrequests: string | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'production_environment'
  })
  production_environment: string | null;

  @Field(() => Int)
  @Column('int', {
    nullable: false,
    default: () => "'1'",
    name: 'auto_idle'
  })
  auto_idle: number;

  @Field(() => Int)
  @Column('int', {
    nullable: false,
    default: () => "'1'",
    name: 'storage_calc'
  })
  storage_calc: number;

  @Field(() => Int)
  @Column('int', {
    nullable: true,
    name: 'openshift'
  })
  openshift: number | null;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 300,
    name: 'openshift_project_pattern'
  })
  openshift_project_pattern: string | null;

  @Field(() => Int)
  @Column('int', {
    nullable: true,
    name: 'development_environments_limit'
  })
  development_environments_limit: number | null;

  @Field()
  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;

  @Field(() => String)
  @Column('varchar', {
    nullable: true,
    length: 5000,
    name: 'private_key'
  })
  private_key: string | null;
}
