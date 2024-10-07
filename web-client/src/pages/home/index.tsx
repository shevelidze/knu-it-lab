import { Box, Button, Spinner, Stack } from '@chakra-ui/react';
import useSWR from 'swr';
import { AddIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { apiFetcher } from 'src/utils';
import { PageHeading } from 'src/components';

const HomePage: React.FC = () => {
  const { data, isLoading, error } = useSWR('/databases', apiFetcher);

  return (
    <Box>
      <PageHeading>Welcome to mega-db client!</PageHeading>
      <Stack>
        {isLoading || error ? (
          <Spinner alignSelf='center' />
        ) : (
          data.databases.map((database: any) => (
            <Button key={database} as={Link} to={`/database/${database}`}>
              {database}
            </Button>
          ))
        )}
        <Button
          leftIcon={<AddIcon />}
          colorScheme='blue'
          as={Link}
          to='/new-database'
        >
          New database
        </Button>
      </Stack>
    </Box>
  );
};

export { HomePage };
