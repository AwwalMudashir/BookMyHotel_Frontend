import axiosInstance from './axiosInstance';

const normalizeBranch = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    id: payload.id ?? payload.branchId ?? payload.branchID ?? null,
    city: payload.city ?? payload.location ?? payload.address ?? '',
    country: payload.country ?? '',
    address: payload.address ?? '',
  };
};

const normalizeHotel = (payload) => {
  if (Array.isArray(payload)) {
    return payload[0] ? normalizeHotel(payload[0]) : {};
  }

  if (payload?.hotel) {
    return normalizeHotel(payload.hotel);
  }

  if (payload?.data) {
    return normalizeHotel(payload.data);
  }

  if (payload?.result) {
    return normalizeHotel(payload.result);
  }

  const normalizedBranches = Array.isArray(payload?.branches)
    ? payload.branches.map(normalizeBranch).filter(Boolean)
    : [];

  const firstBranch = normalizedBranches[0] || null;

  return {
    id: payload?.id ?? payload?.hotelId ?? payload?.hotelID ?? payload?.hotel_id ?? null,
    name: payload?.name ?? payload?.hotelName ?? payload?.title ?? 'Luxury Hotel',
    description: payload?.description ?? payload?.about ?? 'A refined stay designed for comfort and convenience.',
    starRating: Number(payload?.starRating ?? payload?.rating ?? payload?.averageRating ?? payload?.stars ?? 0) || 0,
    logoUrl: payload?.logoUrl ?? payload?.imageUrl ?? payload?.image ?? '',
    images: Array.isArray(payload?.images) ? payload.images : payload?.logoUrl ? [payload.logoUrl] : [],
    branches: normalizedBranches,
    rooms: Array.isArray(payload?.rooms) ? payload.rooms : [],
    location: payload?.location ?? (firstBranch ? `${firstBranch.city}${firstBranch.country ? `, ${firstBranch.country}` : ''}` : 'Global destination'),
  };
};

const normalizeHotelCollection = (payload) => {
  const content = Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.hotels)
            ? payload.hotels
            : [];

  const items = content.map(normalizeHotel);
  const totalElements = payload?.totalElements ?? payload?.total ?? items.length;

  return { items, totalElements };
};

const hotelApi = {
  async getAllHotels(page = 1, size = 100) {
    console.info('[hotelApi] getAllHotels request', { page, size });
    const response = await axiosInstance.get('/hotel/all', {
      params: { page, size },
    });
    console.info('[hotelApi] getAllHotels response', response.data);
    return normalizeHotelCollection(response.data);
  },

  async getHotelById(id) {
    console.info('[hotelApi] getHotelById request', { id });
    const response = await axiosInstance.get(`/hotel/${id}`);
    console.info('[hotelApi] getHotelById response', response.data);
    return normalizeHotel(response.data);
  },

  async getHotelBranches(id) {
    console.info('[hotelApi] getHotelBranches request', { id });
    const response = await axiosInstance.get(`/hotel/${id}/branches`);
    console.info('[hotelApi] getHotelBranches response', response.data);
    return Array.isArray(response.data) ? response.data.map(normalizeBranch).filter(Boolean) : [];
  },

  async getBranchRooms(branchId) {
    console.info('[hotelApi] getBranchRooms request', { branchId });
    const response = await axiosInstance.get(`/branch/${branchId}/rooms`);
    console.info('[hotelApi] getBranchRooms response', response.data);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getBranchReviews(branchId) {
    console.info('[hotelApi] getBranchReviews request', { branchId });
    const response = await axiosInstance.get(`/branch/${branchId}/reviews`);
    console.info('[hotelApi] getBranchReviews response', response.data);
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default hotelApi;
