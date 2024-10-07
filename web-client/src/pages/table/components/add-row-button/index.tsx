import { Button, useToast } from '@chakra-ui/react';
import { RowValuesFormModal } from '../row-values-form-modal';
import { useState } from 'react';
import { apiFetch } from 'src/utils';

type Props = {
  databaseName: string;
  tableName: string;
};

const AddRowButton = ({ databaseName, tableName }: Props) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSubmit = async (values: Record<string, string | null>) => {
    await apiFetch(`/databases/${databaseName}/tables/${tableName}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'insertOne',
        options: {
          value: values,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    toast({
      title: 'The new row has been saved successfully',
      colorScheme: 'green',
    });
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} colorScheme='green'>
        Add row
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

export { AddRowButton };
