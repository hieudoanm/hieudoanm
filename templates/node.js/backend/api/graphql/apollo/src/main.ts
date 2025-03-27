import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLSchema } from 'graphql';
import { NODE_ENV, PORT } from './environments/environments';
import { logger } from './log';
import { schema } from './schema/schema';
import { CountriesDataSource } from './data/countries.data-source';

const main = async ({ schema }: { schema: GraphQLSchema }) => {
  const landingPage: ApolloServerPlugin =
    NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageProductionDefault({ footer: false })
      : ApolloServerPluginLandingPageLocalDefault({ footer: false });
  const server = new ApolloServer({
    schema,
    introspection: true,
    plugins: [landingPage],
  });

  const port: number = Number.parseInt(PORT, 10);
  const { url } = await startStandaloneServer(server, {
    listen: { port },
    async context() {
      return {
        countriesDataSource: new CountriesDataSource(),
      };
    },
  });

  logger.info(`🚀 Apollo Server is ready at ${url}`);
};

main({ schema }).catch(logger.error);
