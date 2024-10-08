import { Column } from './lib/mega-db/column.class';
import { DataTypes } from './lib/mega-db/data-types';
import { Logger } from './lib/mega-db/logger.class';
import { Table } from './lib/mega-db/table.class';

test('logger message format', () => {
  jest.useFakeTimers().setSystemTime(new Date());

  const logger = new Logger({ namespace: 'test1' });

  expect(logger.formatMessage('test2')).toBe(
    `${new Date().toISOString()} [test1] test2`,
  );
});

test('table evaluate search expression with $equal operation', () => {
  const columns = [new Column('id', DataTypes.Real)];

  const table = new Table({
    columns,
    tablePath: 'test',
  });

  expect(
    table.evaluateSearchExpression({ id: 1 }, columns, {
      id: {
        $equal: 1,
      },
    }),
  ).toEqual(true);

  expect(
    table.evaluateSearchExpression({ id: 1 }, columns, {
      id: {
        $equal: 2,
      },
    }),
  ).toEqual(false);
});

test('table evaluate search expression with $pattern operation', () => {
  const columns = [new Column('name', DataTypes.String)];

  const table = new Table({
    columns,
    tablePath: 'test',
  });

  expect(
    table.evaluateSearchExpression({ name: 'abcd' }, columns, {
      name: {
        $pattern: '.+',
      },
    }),
  ).toEqual(true);

  expect(
    table.evaluateSearchExpression({ name: 'abcd' }, columns, {
      name: {
        $pattern: 'ab.d',
      },
    }),
  ).toEqual(true);
});
