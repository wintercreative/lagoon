import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ssh_key', { schema: 'infrastructure' })
@Index('key_fingerprint', ['key_fingerprint'], { unique: true })
export class ssh_key {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('varchar', {
    nullable: false,
    length: 100,
    name: 'name'
  })
  name: string;

  @Column('varchar', {
    nullable: false,
    length: 5000,
    name: 'key_value'
  })
  key_value: string;

  @Column('enum', {
    nullable: false,
    default: () => "'ssh-rsa'",
    enum: ['ssh-rsa', 'ssh-ed25519'],
    name: 'key_type'
  })
  key_type: string;

  @Column('char', {
    nullable: true,
    unique: true,
    length: 51,
    name: 'key_fingerprint'
  })
  key_fingerprint: string | null;

  @Column('timestamp', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created'
  })
  created: Date;
}
