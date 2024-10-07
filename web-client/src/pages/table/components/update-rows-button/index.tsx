import { Button, useToast } from '@chakra-ui/react';
import { RowValuesFormModal } from '../row-values-form-modal';
import { useState } from 'react';
import { apiFetch } from 'src/utils';

type Props = {
  databaseName: string;
  tableName: string;
  whereClause: string;
  isWhereClauseInvalid: boolean;
};

const UpdateRowsButton = ({
  databaseName,
  tableName,
  whereClause,
  isWhereClauseInvalid,
}: Props) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSubmit = async (values: Record<string, string | null>) => {
    await apiFetch(`/databases/${databaseName}/tables/${tableName}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'updateAll',
        options: {
          value: values,
          where: JSON.parse(whereClause),
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    toast({
      title: 'The rows has been updated successfully',
      colorScheme: 'green',
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        colorScheme='orange'
        isDisabled={isWhereClauseInvalid}
      >
        Update matching
      </Button>
      <RowValuesFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        databaseName={databaseName}
        tableName={tableName}
        onSubmit={onSubmit}
      />
    </>
  );
};

export { UpdateRowsButton };
