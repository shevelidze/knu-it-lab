import { apiFetch } from './api-fetch';

const apiFetcher = (key: string) => {
  return apiFetch(key);
};

export { apiFetcher };
