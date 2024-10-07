const apiFetch = async (relativeUrl: string, init: RequestInit = {}) => {
  const url = `http://localhost:8000${relativeUrl}`;

  const response = await fetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export { apiFetch };
