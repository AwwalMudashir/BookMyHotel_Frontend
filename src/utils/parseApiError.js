// Purpose: Normalizes API error responses (plain-text business errors vs JSON { status, message } shapes) into a single readable string.
export const parseApiError = (error, fallback = 'Something went wrong. Please try again.') => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // First, try to extract the backend error message from the response body
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  // If we have a response but no extractable message, handle by status code
  if (status === 401) {
    // Differentiate 401 that originate from login/register attempts vs expired sessions.
    const reqUrl = error?.config?.url || '';
    try {
      if (/\/auth\/login/.test(reqUrl)) {
        return 'Invalid email or password.';
      }
      if (/\/auth\/register/.test(reqUrl)) {
        return 'Registration failed. Please check your input.';
      }
    } catch {
      // ignore regex failures and fall through
    }

    return 'You have to log in';
  }

  // No HTTP response at all (backend unreachable, timeout, CORS) — the raw axios
  // message ("Network Error") isn't something a customer should see, so use the fallback.
  if (!error?.response) {
    return fallback;
  }

  return error?.message || fallback;
};

export default parseApiError;
