import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('environment_service', { schema: 'infrastructure' })
export class environment_service {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('int', {
    nullable: false,
    name: 'environment'
  })
  environment: number;

  @Column('varchar', {
    nullable: false,
    length: 100,
    name: 'name'
  })
  name: string;
}
