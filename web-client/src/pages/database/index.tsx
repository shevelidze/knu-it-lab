import { AddIcon } from '@chakra-ui/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Heading,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';
import { apiFetcher } from 'src/utils';
import useSWR from 'swr';
import { DatabaseTableItem } from './components';

const DatabasePage: React.FC = () => {
  const { databaseName } = useParams();

  const { data, isLoading, error } = useSWR(
    `/databases/${databaseName}/tables`,
    apiFetcher
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href='/'>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>Database {databaseName}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading mb='4'>Database {databaseName}</Heading>
      <Stack>
        {isLoading || error ? (
          <Spinner alignSelf='center' />
        ) : (
          data.tables.map((tableName: any) => (
            <DatabaseTableItem
              key={tableName}
              databaseName={databaseName as string}
              tableName={tableName}
            />
          ))
        )}
        <Button
          leftIcon={<AddIcon />}
          colorScheme='blue'
          as={Link}
          to={`/database/${databaseName}/new-table`}
        >
          New table
        </Button>
      </Stack>
    </>
  );
};

export { DatabasePage };
