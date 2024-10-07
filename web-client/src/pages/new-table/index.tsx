import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  IconButton,
  Input,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeading } from 'src/components';
import { DATA_TYPE_TO_LABEL } from 'src/constants';
import { DataType } from 'src/enums';
import { apiFetch, getErrorToastOptions } from 'src/utils';

interface ColumnData {
  dataType: DataType;
  name: string;
}

const DATA_TYPES_OPTIONS = Object.values(DataType).map((dataType) => (
  <option key={dataType} value={dataType}>
    {DATA_TYPE_TO_LABEL[dataType]}
  </option>
));

const NewTablePage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { databaseName } = useParams();

  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [name, setName] = useState('');

  const columnsNamesDuplicates = useMemo(() => {
    const processedNames = new Set<string>();
    const namesDuplicates = new Set<string>();

    for (const column of columns) {
      if (processedNames.has(column.name)) {
        namesDuplicates.add(column.name);
      } else {
        processedNames.add(column.name);
      }
    }

    return namesDuplicates;
  }, [columns]);

  const invalidSymbolsColumnsNames = useMemo(() => {
    const invalidSymbols = new Set<string>();

    for (const column of columns) {
      if (!/^[a-zA-Z0-9_]*$/.test(column.name)) {
        invalidSymbols.add(column.name);
      }
    }

    return invalidSymbols;
  }, [columns]);

  const isValid = useMemo(() => {
    return (
      name.length > 0 &&
      columns.length > 0 &&
      columns.every((column) => column.name.length > 0) &&
      columnsNamesDuplicates.size === 0 &&
      invalidSymbolsColumnsNames.size === 0
    );
  }, [columns, columnsNamesDuplicates, invalidSymbolsColumnsNames, name]);

  const onAddColumnButtonClick = () => {
    setColumns([...columns, { name: '', dataType: DataType.STRING }]);
  };

  const createTable = async () => {
    try {
      await apiFetch(`/databases/${databaseName}/tables/${name}/create`, {
        method: 'POST',
        body: JSON.stringify({ columns }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      navigate(`/database/${databaseName}/table/${name}`);
    } catch (error) {
      toast(getErrorToastOptions(error));
    }
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href='/'>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/database/${databaseName}`}>
            Database {databaseName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>New table</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <PageHeading>New table {name}</PageHeading>
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder='Table name'
        mb='4'
      />
      <Box>
        <Flex justifyContent='end' mb='2'>
          <Button colorScheme='blue' onClick={onAddColumnButtonClick}>
            Add column
          </Button>
        </Flex>
        <TableContainer>
          <Table variant='simple'>
            <Thead>
              <Tr>
                <Th>Column name</Th>
                <Th>Column type</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {columns.map((column, index) => (
                <Tr key={index}>
                  <Td>
                    <FormControl
                      isInvalid={
                        column.name.length === 0 ||
                        columnsNamesDuplicates.has(column.name) ||
                        invalidSymbolsColumnsNames.has(column.name)
                      }
                    >
                      <Input
                        value={column.name}
                        onChange={(event) => {
                          const newColumns = [...columns];
                          newColumns[index].name = event.target.value;
                          setColumns(newColumns);
                        }}
                      />
                      <FormErrorMessage>
                        {column.name.length === 0 && 'Column name is required'}
                        {column.name.length > 0 &&
                          columnsNamesDuplicates.has(column.name) &&
                          'Column name must be unique'}
                        {invalidSymbolsColumnsNames.has(column.name) &&
                          'Column name must contain only letters, numbers, and underscores'}
                      </FormErrorMessage>
                    </FormControl>
                  </Td>
                  <Td>
                    <Select
                      value={column.dataType}
                      onChange={(event) => {
                        const newColumns = [...columns];
                        newColumns[index].dataType = event.target
                          .value as DataType;
                        setColumns(newColumns);
                      }}
                    >
                      {DATA_TYPES_OPTIONS}
                    </Select>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label='Delete column'
                      icon={<DeleteIcon />}
                      onClick={() => {
                        const newColumns = [...columns];
                        newColumns.splice(index, 1);
                        setColumns(newColumns);
                      }}
                      colorScheme='red'
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <Flex mt='4' justifyContent='flex-end'>
          <Button
            colorScheme='blue'
            isDisabled={!isValid}
            onClick={createTable}
          >
            Create table
          </Button>
        </Flex>
      </Box>
    </>
  );
};

export { NewTablePage };
