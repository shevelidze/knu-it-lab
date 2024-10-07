import { UseToastOptions } from '@chakra-ui/react';
import { getErrorMessage } from './get-error-message';

function getErrorToastOptions(error: unknown): UseToastOptions {
  return {
    title: 'Error',
    description: getErrorMessage(error),
    colorScheme: 'red',
  };
}

export { getErrorToastOptions };
