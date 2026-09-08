export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134/api';

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
    throw new Error(errorBody.message || 'The request could not be completed.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
