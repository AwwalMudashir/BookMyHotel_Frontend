import axiosInstance from './axiosInstance';

// Purpose: Contact enquiry submission API helpers.
const contactApi = {
  // Public — saved to the database regardless of whether the internal
  // support-notification email succeeds, so a 201 always means it was received.
  async submitEnquiry({ name, email, message }) {
    const res = await axiosInstance.post('/contact', { name, email, message });
    return res.data;
  },
};

export default contactApi;
