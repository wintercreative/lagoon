import { InputType, Field } from 'type-graphql';
import { MaxLength, IsAlphanumeric, IsEmail, IsAlpha } from 'class-validator';

@InputType()
export class ProjectInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;
}
