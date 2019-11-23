import { InputType, Field, Int } from 'type-graphql';
import { MaxLength, IsAlphanumeric, IsEmail, IsAlpha } from 'class-validator';
import { Availability } from '../../project/enums/availability';

@InputType()
export class AddProjectInput {
  @Field()
  @MaxLength(100)
  @IsAlphanumeric()
  name: string;

  @Field({ nullable: true })
  gitUrl?: string;

  @Field({ nullable: true })
  subfolder?: string;

  @Field(() => Int, { nullable: true })
  openshift?: number;

  @Field({ nullable: true })
  openshiftProjectPattern?: string;

  @Field({ nullable: true })
  activeSystemsDeploy?: string;

  @Field({ nullable: true })
  activeSystemsPromote?: string;

  @Field({ nullable: true })
  activeSystemsRemove?: string;

  @Field({ nullable: true })
  activeSystemsTask?: string;

  @Field({ nullable: true })
  branches?: string;

  @Field({ nullable: true })
  pullrequests: string;

  @Field({ nullable: true })
  productionEnvironment?: string;

  @Field(() => Availability)
  availability: Availability;

  @Field({ nullable: true })
  autoIdle?: number;

  @Field(() => Int, { nullable: true })
  storageCalc?: number;

  @Field(() => Int, { nullable: true })
  developmentEnvironmentsLimit: number;

  @Field({ nullable: true })
  privateKey?: string;
}
