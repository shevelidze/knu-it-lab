import { createBrowserRouter } from 'react-router-dom';

import {
  HomePage,
  DatabasePage,
  NewDatabasePage,
  NewTablePage,
  TablePage,
} from './pages';
import { Root } from './containers';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/database/:databaseName',
        element: <DatabasePage />,
      },
      {
        path: '/database/:databaseName/new-table',
        element: <NewTablePage />,
      },
      {
        path: '/database/:databaseName/table/:tableName',
        element: <TablePage />,
      },
      {
        path: '/new-database',
        element: <NewDatabasePage />,
      },
    ],
  },
]);

export default router;
