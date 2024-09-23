import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { databaseService } from './services';

const server: FastifyInstance = Fastify({});

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          pong: {
            type: 'string',
          },
        },
      },
    },
  },
};

server.get('/ping', opts, async (request, reply) => {
  return { pong: 'it worked!' };
});

const start = async () => {
  await databaseService.initialize({ databasePath: './data' });

  const database = databaseService.getDatabase();

  const usersTable = database.getTableByName('users');

  const result = await usersTable.findAll({
    columns: ['age', 'name'],
    where: {
      $or: [
        {
          age: {
            $equal: 25,
          },
        },
        {
          name: {
            $pattern: 'Ivan',
          },
        },
      ],
    },
  });

  try {
    await server.listen({ port: 3000 });

    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
