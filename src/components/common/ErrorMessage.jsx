// Purpose: Inline form validation error message component.
const ErrorMessage = ({ message }) => message ? <p className="text-sm text-red-600">{message}</p> : null;
export default ErrorMessage;
