import { registerEnumType } from 'type-graphql';

export enum Availability {
  STANDARD = 'STANDARD',
  HIGH = 'HIGH'
}

// Register the Enum to GraphQL
registerEnumType(Availability, {
  name: 'Availability',
  description: 'The project availability'
});
