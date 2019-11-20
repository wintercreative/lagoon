import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('s3_file', { schema: 'infrastructure' })
export class s3_file {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: false,
    length: 100,
    name: 'filename'
  })
  filename: string;

  @Column('text', {
    nullable: false,
    name: 's3_key'
  })
  s3_key: string;

  @Column('datetime', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;

  @Column('datetime', {
    nullable: false,
    default: () => "'0000-00-00 00:00:00'",
    name: 'deleted'
  })
  deleted: Date;
}
