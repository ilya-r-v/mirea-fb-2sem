import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,

  includeStacktraceInErrorResponses: true,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`GraphQL Server ready at: ${url}`);
console.log(`Apollo Sandbox: ${url}`);