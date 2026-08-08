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

	async createBranch(payload) {
		const res = await axiosInstance.post('/branch/create', payload);
		return res.data;
	},

	// Partial update — mirrors PUT /hotel/update/{id}'s path shape.
	async updateBranch(id, payload) {
		const res = await axiosInstance.put(`/branch/update/${id}`, payload);
		return res.data;
	},

	async getReservations({ hotelId, date, status, page = 0, size = 20 } = {}) {
		const res = await axiosInstance.get('/admin/reservations', {
			params: {
				...(hotelId ? { hotelId } : {}),
				...(date ? { date } : {}),
				...(status ? { status } : {}),
				page,
				size,
			},
		});
		return res.data;
	},

	async updateReservationStatus(id, status) {
		const res = await axiosInstance.put(`/admin/reservations/${id}`, { status });
		return res.data;
	},

	// Users management
	async getUsers() {
		const res = await axiosInstance.get('/admin/users');
		return res.data;
	},

	async deleteUser(userId) {
		const res = await axiosInstance.delete(`/admin/users/${userId}`);
		return res.data;
	},
};

export default adminApi;
