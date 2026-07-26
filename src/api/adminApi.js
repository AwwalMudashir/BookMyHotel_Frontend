import axiosInstance from './axiosInstance';

const normalizeAdminHotel = (h) => ({
	id: h?.id ?? h?.hotelId ?? null,
	name: h?.name ?? h?.hotelName ?? 'Hotel',
	description: h?.description ?? h?.about ?? '',
	starRating: Number(h?.starRating ?? h?.stars ?? 0) || 0,
	branches: Array.isArray(h?.branches) ? h.branches : [],
	status: h?.status ?? 'ACTIVE',
});

const adminApi = {
	async createHotel(payload) {
		const res = await axiosInstance.post('/hotel/create', payload);
		return normalizeAdminHotel(res.data);
	},

	async updateHotel(id, payload) {
		const res = await axiosInstance.put(`/hotel/update/${id}`, payload);
		return normalizeAdminHotel(res.data);
	},

	async deleteHotel(id) {
		const res = await axiosInstance.delete(`/hotel/delete/${id}`);
		return res.data;
	},
};

export default adminApi;
