import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('environment_storage', { schema: 'infrastructure' })
@Index(
  'environment_persistent_storage_claim_updated',
  ['environment', 'persistent_storage_claim', 'updated'],
  { unique: true }
)
export class environment_storage {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id'
  })
  id: number;

  @Column('int', {
    nullable: true,
    name: 'environment'
  })
  environment: number | null;

  @Column('varchar', {
    nullable: true,
    length: 100,
    name: 'persistent_storage_claim'
  })
  persistent_storage_claim: string | null;

  @Column('bigint', {
    nullable: true,
    name: 'bytes_used'
  })
  bytes_used: string | null;

  @Column('date', {
    nullable: true,
    name: 'updated'
  })
  updated: string | null;
}
