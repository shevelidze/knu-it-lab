import { AddIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DATA_TYPE_TO_LABEL } from 'src/constants';
import { DataType } from 'src/enums';
import { apiFetch, getErrorToastOptions } from 'src/utils';

type Props = {
  databaseName: string;
  tableName: string;
  onSubmit: (values: Record<string, string | null>) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

type Column = {
  name: string;
  dataType: {
    name: DataType;
  };
};

const REGEXP_BY_DATA_TYPE: Record<DataType, RegExp> = {
  [DataType.INTEGER]: /^-?[0-9]+$/,
  [DataType.REAL]: /^-?[0-9]+(\.[0-9]+)?$/,
  [DataType.CHAR]: /^.{1}$/,
  [DataType.STRING]: /^.{1,}$/,
  [DataType.STRING_INTERVAL]: /^.{1,} - .{1,}$/,
  [DataType.CHAR_INTERVAL]: /^.{1} - .{1}$/,
};

const EXPECTED_FORMAT_BY_DATA_TYPE: Record<DataType, string> = {
  [DataType.INTEGER]: '12',
  [DataType.REAL]: '1.4',
  [DataType.CHAR]: 'a',
  [DataType.STRING]: 'abc',
  [DataType.STRING_INTERVAL]: 'abc - def',
  [DataType.CHAR_INTERVAL]: 'a - b',
};

const RowValuesFormModal: React.FC<Props> = ({
  databaseName,
  tableName,
  onSubmit,
  isOpen,
  onClose,
  title,
}) => {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);
  const [values, setValues] = useState<Record<string, string | null>>({});

  const loadColumns = useCallback(async () => {
    const columns = await apiFetch(
      `/databases/${databaseName}/tables/${tableName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          operation: 'getColumns',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    setColumns(columns);
  }, [databaseName, tableName]);

  const clearAndCloseModal = () => {
    setValues({});
    onClose();
  };

  const saveRow = async () => {
    setIsSaving(true);

    try {
      await onSubmit(values);

      setIsSaving(false);
      clearAndCloseModal();
    } catch (error) {
      toast(getErrorToastOptions(error));
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  const errors = useMemo(() => {
    const dataTypeByColumnName = columns.reduce<Record<string, DataType>>(
      (acc, column) => {
        acc[column.name] = column.dataType.name;
        return acc;
      },
      {}
    );

    const errors: Record<string, string> = {};

    for (const [columnName, value] of Object.entries(values)) {
      if (value === null || value.length === 0) {
        continue;
      }

      if (!REGEXP_BY_DATA_TYPE[dataTypeByColumnName[columnName]].test(value)) {
        errors[columnName] = `Invalid value. Expected format: ${
          EXPECTED_FORMAT_BY_DATA_TYPE[dataTypeByColumnName[columnName]]
        }`;
      }
    }

    return errors;
  }, [columns, values]);

  const createInputChangeHandler = (columnName: string) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value.length === 0) {
        const { [columnName]: _, ...newValues } = values;

        setValues(newValues);
        return;
      }

      setValues({
        ...values,
        [columnName]: event.target.value,
      });
    };
  };

  const createCheckboxChangeHandler = (columnName: string) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        setValues({
          ...values,
          [columnName]: null,
        });
      } else {
        const { [columnName]: _, ...newValues } = values;

        setValues(newValues);
      }
    };
  };

  if (columns.length === 0) {
    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={clearAndCloseModal} isCentered size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>Column name</Th>
                  <Th>Data type</Th>
                  <Th>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {columns.map((column, index) => (
                  <Tr key={index}>
                    <Td>{column.name}</Td>
                    <Td>{DATA_TYPE_TO_LABEL[column.dataType.name]}</Td>
                    <Td>
                      <HStack>
                        <FormControl isInvalid={Boolean(errors[column.name])}>
                          <Input
                            value={values[column.name] ?? ''}
                            onChange={createInputChangeHandler(column.name)}
                          />
                          <FormErrorMessage>
                            {errors[column.name]}
                          </FormErrorMessage>
                        </FormControl>
                        <Checkbox
                          checked={values[column.name] === null}
                          onChange={createCheckboxChangeHandler(column.name)}
                        >
                          <i>null</i>
                        </Checkbox>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <ModalFooter>
            <HStack>
              <Button onClick={clearAndCloseModal}>Cancel</Button>
              <Button
                colorScheme='blue'
                onClick={saveRow}
                isLoading={isSaving}
                isDisabled={Object.keys(errors).length > 0}
              >
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export { RowValuesFormModal };
