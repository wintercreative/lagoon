import { makeExecutableSchema } from 'graphql-tools';
import {
  KeycloakTypeDefs,
  KeycloakSchemaDirectives
} from 'keycloak-connect-graphql';
import { buildSchema, buildTypeDefsAndResolvers } from 'type-graphql';

export const createSchema = () =>
  buildSchema({
    resolvers: [__dirname + '/../**/*.resolver.ts'],
    validate: true
  });

export const createSchemaWithKeycloakTypeDefs = async () => {
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
    resolvers: [__dirname + '/../**/*.resolver.ts']
  });

  return makeExecutableSchema({
    typeDefs: [KeycloakTypeDefs, typeDefs],
    schemaDirectives: KeycloakSchemaDirectives,
    resolvers
  });
};
