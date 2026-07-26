import axiosInstance from './axiosInstance';

const searchApi = {
  searchRooms: async (params) => {
    const response = await axiosInstance.get('/search/rooms', { params });
    return response.data;
  },
};

export default searchApi;
