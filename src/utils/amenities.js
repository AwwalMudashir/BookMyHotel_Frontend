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

const humanize = (str) => {
  if (!str) return '';
  // Replace underscores and dashes with spaces
  const withSpaces = str.replace(/[_-]/g, ' ');
  // Insert spaces between camelCase boundaries: fooBar -> foo Bar
  const spaced = withSpaces.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  // Capitalize first letter of each word
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const listAmenities = (amenities) =>
  amenities
    ? Object.entries(amenities)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => {
          if (amenityMeta[key]) return amenityMeta[key];
          return { key, label: humanize(key), icon: null };
        })
    : [];

export default amenityMeta;
