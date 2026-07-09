// Purpose: Calculates the number of nights between dates.
export const calculateNights = (checkIn, checkOut) => { if (!checkIn || !checkOut) return 0; return Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)); };
export default calculateNights;
