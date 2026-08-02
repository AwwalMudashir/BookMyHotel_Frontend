import axiosInstance from './axiosInstance';

// Purpose: Branch review submission, listing, and admin moderation API helpers.
const reviewApi = {
  async submitReview(payload) {
    const response = await axiosInstance.post('/reviews', payload);
    return response.data;
  },

  // Flat custom shape — { reviews, page, size, totalElements, totalPages, averageRating } —
  // not a Spring Page. Always trust averageRating/totalElements from here, never compute an
  // average client-side from whatever page of reviews happens to be loaded.
  async getBranchReviews(branchId, { page = 0, size = 10 } = {}) {
    const response = await axiosInstance.get(`/branches/${branchId}/reviews`, {
      params: { page, size },
    });
    return response.data;
  },

  // Admin-only moderation.
  async deleteReview(reviewId) {
    await axiosInstance.delete(`/reviews/${reviewId}`);
  },
};

export default reviewApi;
