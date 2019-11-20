import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user', { schema: 'infrastructure' })
@Index('email', ['email'], { unique: true })
export class user {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: true,
    unique: true,
    length: 100,
    name: 'email'
  })
  email: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'first_name'
  })
  first_name: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'last_name'
  })
  last_name: string | null;

  @Column('text', {
    nullable: true,
    name: 'comment'
  })
  comment: string | null;

  @Column('int', {
    nullable: true,
    name: 'gitlab_id'
  })
  gitlab_id: number | null;
}
