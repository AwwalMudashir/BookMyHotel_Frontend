// Purpose: Normalizes API error responses (plain-text business errors vs JSON { status, message } shapes) into a single readable string.
export const parseApiError = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  // No HTTP response at all (backend unreachable, timeout, CORS) — the raw axios
  // message ("Network Error") isn't something a customer should see, so use the fallback.
  if (!error?.response) {
    return fallback;
  }

  return error?.message || fallback;
};

export default parseApiError;
