import { ApolloServer } from 'apollo-server-express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import 'reflect-metadata';
import { createConnection } from 'typeorm';

import { createSchema } from './modules/createSchema';
import ormConfig from './ormconfig';

const ormOptions = ormConfig[process.env.NODE_ENV || 'development'];
const corsRequestHandler = cors({
  credentials: true,
  origin: 'http://localhost:3000'
});

(async () => {
  const app = express();

  // Call middlewares
  // app.use(corsRequestHandler);
  // app.use(helmet());
  // app.use(bodyParser.json());

  await createConnection({ ...ormOptions, name: 'default' });

  const apolloServer = new ApolloServer({
    schema: await createSchema(),
    playground: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
    introspection: true,
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
})();
