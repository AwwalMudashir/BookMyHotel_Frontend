// Purpose: Formats ISO dates into readable labels.
export const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '';
export default formatDate;
