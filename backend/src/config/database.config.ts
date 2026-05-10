import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',

  url: config.getOrThrow<string>('DATABASE_URL'),

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  synchronize: false,

  ssl: {
    rejectUnauthorized: false,
  },
});