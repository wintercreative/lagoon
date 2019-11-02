import * as Client from 'mariasql';

import * as logger from '../logger';

let client: Client.MariaClient;

export const getSqlClient = () => {
  if (client) {
    return client;
  }
  const sqlClient = new Client({
    host: 'api-db',
    port: 3306,
    user: 'api',
    password: 'api',
    db: 'infrastructure',
  });

  sqlClient.on('error', error => {
    logger.error(error.message);
  });
  client = sqlClient;
  return sqlClient;
};

module.exports = {
  getSqlClient,
};
