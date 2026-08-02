import { Bath, Coffee, DoorOpen, ParkingCircle, Waves, Wifi, Wind } from 'lucide-react';

// Purpose: Shared amenity key -> label/icon mapping used across room cards and the room detail page.
export const amenityMeta = {
  wifi: { label: 'Wi-Fi', icon: Wifi },
  airConditioning: { label: 'Air conditioning', icon: Wind },
  bathtub: { label: 'Bathtub', icon: Bath },
  breakfast: { label: 'Breakfast', icon: Coffee },
  parking: { label: 'Parking', icon: ParkingCircle },
  balcony: { label: 'Balcony', icon: DoorOpen },
  pool: { label: 'Pool', icon: Waves },
};

export const listAmenities = (amenities) =>
  amenities
    ? Object.entries(amenities)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => amenityMeta[key] || { key, label: key, icon: null })
    : [];

export default amenityMeta;
