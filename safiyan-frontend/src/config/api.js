export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134/api';

console.log('API_BASE_URL is:', API_BASE_URL);

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('sies-auth-token');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));

    const validationErrors = errorBody?.errors
      ? Object.entries(errorBody.errors)
          .flatMap(([field, messages]) =>
            Array.isArray(messages)
              ? messages.map((message) => `${field}: ${message}`)
              : [`${field}: ${messages}`]
          )
          .join(' | ')
      : '';

    const message =
      errorBody?.message ||
      errorBody?.title ||
      errorBody?.detail ||
      validationErrors ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}