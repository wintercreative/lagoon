import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('env_vars', { schema: 'infrastructure' })
@Index('name_project', ['name', 'project'], { unique: true })
@Index('name_environment', ['name', 'environment'], { unique: true })
export class env_vars {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: false,
    length: 300,
    name: 'name'
  })
  name: string;

  @Column('text', {
    nullable: false,
    name: 'value'
  })
  value: string;

  @Column('enum', {
    nullable: false,
    default: () => "'global'",
    enum: ['global', 'build', 'runtime'],
    name: 'scope'
  })
  scope: string;

  @Column('int', {
    nullable: true,
    name: 'project'
  })
  project: number | null;

  @Column('int', {
    nullable: true,
    name: 'environment'
  })
  environment: number | null;
}
