import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  HStack,
  IconButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from 'src/utils';
import { mutate } from 'swr';

type Props = {
  databaseName: string;
  tableName: string;
};

const DatabaseTableItem: React.FC<Props> = ({ databaseName, tableName }) => {
  const toast = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteTable = async () => {
    await apiFetch(`/databases/${databaseName}/tables/${tableName}`, {
      method: 'DELETE',
    });

    mutate(`/databases/${databaseName}/tables`);
    setIsDeleteModalOpen(false);

    toast({
      title: `The ${tableName} table has been deleted`,
      colorScheme: 'green',
    });
  };

  return (
    <Flex gap={2}>
      <Button
        as={Link}
        to={`/database/${databaseName}/table/${tableName}`}
        flexGrow={1}
      >
        {tableName}
      </Button>
      <IconButton
        aria-label='Delete table'
        icon={<DeleteIcon />}
        colorScheme='red'
        onClick={() => setIsDeleteModalOpen(true)}
      />
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Are you sure you want to delete the {tableName} table?
          </ModalHeader>
          <ModalFooter>
            <HStack>
              <Button onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={deleteTable}>
                Delete
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export { DatabaseTableItem };
