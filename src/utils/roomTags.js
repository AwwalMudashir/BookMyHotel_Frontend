import { Laptop, Leaf } from 'lucide-react';

// Purpose: Shared ECO_FRIENDLY / WORK_FRIENDLY room tag metadata — the only two tag values the
// backend supports right now (RoomResponse/RoomResponseDto/RoomSearchResult all expose `tags`).
export const ROOM_TAG_META = {
  ECO_FRIENDLY: { label: 'Eco-friendly', icon: Leaf, classes: 'bg-[#E2F0E8] text-[#1D6A2D]' },
  WORK_FRIENDLY: { label: 'Work-friendly', icon: Laptop, classes: 'bg-[#E6F0FA] text-[#1D4E8A]' },
};

export const ROOM_TAG_OPTIONS = [
  { value: 'ECO_FRIENDLY', ...ROOM_TAG_META.ECO_FRIENDLY },
  { value: 'WORK_FRIENDLY', ...ROOM_TAG_META.WORK_FRIENDLY },
];

export default ROOM_TAG_META;
