import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customer', { schema: 'infrastructure' })
@Index('name', ['name'], { unique: true })
export class customer {
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

  @Column('text', {
    nullable: true,
    name: 'comment'
  })
  comment: string | null;

  @Column('varchar', {
    nullable: true,
    length: 5000,
    name: 'private_key'
  })
  private_key: string | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;
}
