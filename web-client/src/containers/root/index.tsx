import { Box, Card, CardBody } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

const Root: React.FC = () => {
  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='center'
      minH='100vh'
      bg='gray.100'
    >
      <Card minW='lg'>
        <CardBody>
          <Outlet />
        </CardBody>
      </Card>
    </Box>
  );
};

export { Root };
