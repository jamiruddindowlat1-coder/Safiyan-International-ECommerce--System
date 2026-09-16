export const isRequired = (value) => Boolean(String(value || '').trim());
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
export const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
