module.exports = [
  {
    name: 'development',
    type: 'mysql',
    host: 'api-db',
    database: 'infrastructure',
    port: 3306,
    username: 'api',
    password: 'api',
    synchronize: true,
    logging: true,
    entities: ['src/entity/**/*.ts'],
    migrations: ['src/migration/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
    cli: {
      entitiesDir: 'src/entity',
      migrationsDir: 'src/migration',
      subscribersDir: 'src/subscriber'
    }
  }
];
