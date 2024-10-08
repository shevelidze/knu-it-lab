import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import cors from '@fastify/cors';
import { databaseManagerService } from './services';

const server: FastifyInstance = Fastify({});

server.register(cors, {
  origin: '*',
});

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

server.post(
  '/databases/:databaseName/tables/:tableName',
  async (request, reply) => {
    const { databaseName, tableName } = request.params as any;
    const { operation, options } = (request.body as any) ?? {};

    const databaseManager = databaseManagerService.getDatabaseManager();
    const database = databaseManager.getDatabaseByName(databaseName);
    const table = database.getTableByName(tableName);

    if (!(operation in table)) {
      throw new Error(`Operation ${operation} not found`);
    }

    return await (table[operation as keyof typeof table] as any)(options);
  },
);

server.delete(
  '/databases/:databaseName/tables/:tableName',
  async (request, reply) => {
    const { databaseName, tableName } = request.params as any;

    const databaseManager = databaseManagerService.getDatabaseManager();
    const database = databaseManager.getDatabaseByName(databaseName);
    const table = database.getTableByName(tableName);

    await table.delete();

    return {
      table: table.getName(),
    };
  },
);

server.post(
  '/databases/:databaseName/tables/:tableName/create',
  async (request, reply) => {
    const { databaseName, tableName } = request.params as any;

    const databaseManager = databaseManagerService.getDatabaseManager();
    const database = databaseManager.getDatabaseByName(databaseName);

    const table = await database.createTable(tableName, request.body);

    return {
      table: table.getName(),
    };
  },
);

server.get('/databases/:databaseName/tables', async (request, reply) => {
  const { databaseName } = request.params as any;

  const databaseManager = databaseManagerService.getDatabaseManager();
  const database = databaseManager.getDatabaseByName(databaseName);

  return {
    tables: database.getTables().map((table) => table.getName()),
  };
});

server.get('/databases', async (request, reply) => {
  const databaseManager = databaseManagerService.getDatabaseManager();

  return {
    databases: databaseManager
      .getDatabases()
      .map((database) => database.getName()),
  };
});

server.post('/databases/:databaseName', async (request, reply) => {
  const { databaseName } = request.params as any;

  const databaseManager = databaseManagerService.getDatabaseManager();

  const database = await databaseManager.createDatabase(databaseName);

  return {
    name: database.getName(),
  };
});

const start = async () => {
  await databaseManagerService.initialize({ path: './data' });

  try {
    await server.listen({ port: 8000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
