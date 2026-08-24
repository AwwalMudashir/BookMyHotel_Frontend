import axiosInstance from './axiosInstance';

const normalizeBranch = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    id: payload.id ?? payload.branchId ?? payload.branchID ?? null,
    hotelId: payload.hotelId ?? payload.hotelID ?? null,
    hotelName: payload.hotelName ?? null,
    name: payload.name ?? '',
    city: payload.city ?? payload.location ?? payload.address ?? '',
    country: payload.country ?? '',
    address: payload.address ?? '',
    currency: payload.currency ?? payload.currencyCode ?? null,
    checkInTime: payload.checkInTime ?? null,
    checkOutTime: payload.checkOutTime ?? null,
    // Admin-set only, not derived from anything — same status as starRating.
    ecoCertified: Boolean(payload.ecoCertified),
    ecoTags: Array.isArray(payload.ecoTags) ? payload.ecoTags : [],
    ecoScore: payload.ecoScore ?? null,
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
    currency: payload?.currency ?? payload?.currencyCode ?? firstBranch?.currency ?? null,
    logoUrl: payload?.logoUrl ?? payload?.imageUrl ?? payload?.image ?? '',
    longImage: payload?.longImage ?? payload?.long_image ?? payload?.hotelLongImage ?? '',
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
    const response = await axiosInstance.get('/hotel/all', {
      params: { page, size },
    });
    return normalizeHotelCollection(response.data);
  },

  async getHotelById(id) {
    const response = await axiosInstance.get(`/hotel/${id}`);
    return normalizeHotel(response.data);
  },

  async getHotelBranches(id) {
    const response = await axiosInstance.get(`/hotel/${id}/branches`);
    return Array.isArray(response.data) ? response.data.map(normalizeBranch).filter(Boolean) : [];
  },

  // Full branch detail — the only endpoint documented to carry ecoCertified/ecoTags/ecoScore.
  async getBranchById(id) {
    const response = await axiosInstance.get(`/branch/${id}`);
    return normalizeBranch(response.data);
  },

  async getBranchRooms(branchId) {
    const response = await axiosInstance.get(`/branch/${branchId}/rooms`);
    return Array.isArray(response.data) ? response.data : [];
  },

};

export default hotelApi;
