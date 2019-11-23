export const ormConfig = {
  development: {
    type: 'mysql',
    host: 'localhost',
    database: 'infrastructure',
    port: 3306,
    username: 'api',
    password: 'api',
    synchronize: false,
    logging: true,
    entities: ['src/entity/**/*.ts'],
    migrations: ['src/migration/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
    cli: {
      entitiesDir: 'src/entity',
      migrationsDir: 'src/migration',
      subscribersDir: 'src/subscriber'
    }
  },
  production: {
    type: 'mysql',
    url: process.env.DATABASE_URL,
    synchronize: true, // switch this to false once you have the initial tables created and use migrations instead
    logging: false,
    entities: ['dist/entity/**/*.js'],
    migrations: ['dist/migration/**/*.js'],
    subscribers: ['dist/subscriber/**/*.js'],
    cli: {
      entitiesDir: 'dist/entity',
      migrationsDir: 'dist/migration',
      subscribersDir: 'dist/subscriber'
    }
  }
};

export default ormConfig;
