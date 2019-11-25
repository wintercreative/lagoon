import { ApolloServer } from 'apollo-server-express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import Keycloak from 'keycloak-connect';
import {
  KeycloakContext,
  KeycloakTypeDefs,
  KeycloakSchemaDirectives
} from 'keycloak-connect-graphql';
import KeycloakConfig from 'keycloak-connect/middleware/auth-utils/config';

import {
  createSchema,
  createSchemaWithKeycloakTypeDefs
} from './modules/createSchema';
import ormConfig from './ormconfig';

const ormOptions = ormConfig[process.env.NODE_ENV || 'development'];
const corsRequestHandler = cors({
  credentials: true,
  origin: 'http://localhost:3000'
});

const keyCloakConfig = new KeycloakConfig({
  authServerUrl: 'http://localhost:8080/auth',
  realm: 'lagoon',
  clientId: 'api',
  bearerOnly: true,
  credentials: {
    secret: '39d5282d-3684-4026-b4ed-04bbc034b61a'
  }
});

(async () => {
  const app = express();
  const keycloak = new Keycloak({}, keyCloakConfig);

  app.use(keycloak.middleware());

  // Call middlewares
  // app.use(corsRequestHandler);
  // app.use(helmet());
  // app.use(bodyParser.json());

  await createConnection({ ...ormOptions, name: 'default' });

  const apolloServer = new ApolloServer({
    schema: await createSchemaWithKeycloakTypeDefs(),
    playground: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
    introspection: true,
    // context: ({ req, res }) => ({ req, res })
    context: ({ req, res }) => ({
      req,
      res,
      kauth: new KeycloakContext({ req })
    })
  });

  apolloServer.applyMiddleware({ app });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
})();
