import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { PageHeading } from 'src/components';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { useMemo, useState } from 'react';
import { apiFetch, getErrorToastOptions } from 'src/utils';
import { DATA_TYPE_TO_LABEL } from 'src/constants';
import { DataType } from 'src/enums';
import { AddRowButton, UpdateRowsButton } from './components';

const TablePage: React.FC = () => {
  const toast = useToast();
  const { databaseName, tableName } = useParams();
  const [whereClause, setWhereClause] = useState('{}');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const columns = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    return Object.keys(data[0]).map((key) => {
      return {
        name: key,
        dataType: data[0][key].dataType.name as DataType,
      };
    });
  }, [data]);

  const runQuery = async (isDelete: boolean = false) => {
    try {
      setIsLoading(true);

      const fetchedData = await apiFetch(
        `/databases/${databaseName}/tables/${tableName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            operation: isDelete ? 'deleteAll' : 'findAll',
            options: {
              where: JSON.parse(whereClause),
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setData(fetchedData);
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast(getErrorToastOptions(error));
    }
  };

  const isWhereClauseValid = useMemo(() => {
    try {
      JSON.parse(whereClause);
      return true;
    } catch {
      return false;
    }
  }, [whereClause]);

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
          <BreadcrumbLink>Table {tableName}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <PageHeading>Table {tableName}</PageHeading>
      <Box mb='2'>
        <Text>Where clause</Text>
        <CodeMirror
          value={whereClause}
          extensions={[json()]}
          onChange={(value) => setWhereClause(value)}
          height='150px'
        />
      </Box>
      <Flex mb='2' justifyContent='flex-end' gap='2'>
        <AddRowButton
          databaseName={databaseName as string}
          tableName={tableName as string}
        />
        <UpdateRowsButton
          databaseName={databaseName as string}
          tableName={tableName as string}
          whereClause={whereClause}
          isWhereClauseInvalid={!isWhereClauseValid}
        />
        <Button
          colorScheme='red'
          onClick={() => setIsDeleteModalOpen(true)}
          isDisabled={!isWhereClauseValid}
        >
          Delete matching
        </Button>
        <Button
          colorScheme='blue'
          onClick={() => runQuery()}
          isDisabled={!isWhereClauseValid}
        >
          Find matching
        </Button>
      </Flex>
      <Box>
        <Text>Results</Text>
        {isLoading ? (
          <Flex justifyContent='center'>
            <Spinner />
          </Flex>
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  {columns.map((column) => (
                    <th key={column.name}>
                      {column.name} ({DATA_TYPE_TO_LABEL[column.dataType]})
                    </th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {data.map((row, index) => (
                  <Tr key={index}>
                    {columns.map((column) => (
                      <Td key={column.name}>
                        {row[column.name].value ?? <i>null</i>}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Are you sure you want to delete all the records that match the
            condition?
          </ModalHeader>
          <ModalFooter>
            <HStack>
              <Button onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={() => runQuery(true)}>
                Delete
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export { TablePage };
