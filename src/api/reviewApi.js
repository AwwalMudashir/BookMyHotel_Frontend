import axiosInstance from './axiosInstance';

const reviewApi = {
  async submitReview(payload) {
    const response = await axiosInstance.post('/reviews', payload);
    return response.data;
  },
};

export default reviewApi;
