import { Heading } from '@chakra-ui/react';

type Props = {
  children: React.ReactNode;
};

const PageHeading: React.FC<Props> = ({ children }) => {
  return <Heading marginBottom={4}>{children}</Heading>;
};

export { PageHeading };
