import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { CountriesModule } from './modules/countries/countries.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    HealthModule,
    CountriesModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: process.env.NODE_ENV === 'development',
      autoSchemaFile: join(process.cwd(), 'src/schema/schema.gql'),
    }),
  ],
})
export class AppModule {}
