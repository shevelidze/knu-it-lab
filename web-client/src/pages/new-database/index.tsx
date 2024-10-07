import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Input,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeading } from 'src/components';
import { apiFetch, getErrorToastOptions } from 'src/utils';

const NewDatabasePage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [databaseName, setDatabaseName] = useState('');

  const createDatabase = async () => {
    try {
      await apiFetch(`/databases/${databaseName}`, {
        method: 'POST',
      });

      navigate(`/database/${databaseName}`);
    } catch (error) {
      toast(getErrorToastOptions(error));
    }
  };

  const onCreateButtonClick = () => {
    createDatabase();
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href='/'>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>New database</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <PageHeading>New database</PageHeading>
      <Stack>
        <Input
          value={databaseName}
          onChange={(event) => setDatabaseName(event.target.value)}
          placeholder='Database name'
        />
        <Button
          colorScheme='blue'
          isDisabled={databaseName.length === 0}
          onClick={onCreateButtonClick}
        >
          Create
        </Button>
      </Stack>
    </>
  );
};

export { NewDatabasePage };
