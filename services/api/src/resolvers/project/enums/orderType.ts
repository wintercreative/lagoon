import { Field, ObjectType, registerEnumType } from 'type-graphql';

export enum ProjectOrderType {
  NAME = 'NAME',
  CREATED = 'CREATED'
}

// Register the Enum to GraphQL
registerEnumType(ProjectOrderType, {
  name: 'ProjectOrderType',
  description: 'The project availability'
});
