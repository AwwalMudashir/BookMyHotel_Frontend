import { Car, Compass, Sparkles, UtensilsCrossed, Wine } from 'lucide-react';

// Purpose: Shared serviceType enum (BAR | RESTAURANT | CAR_HIRE | SPA | TOUR) -> label/icon,
// used by both the customer-facing add-on checkboxes and the manager's service-creation form.
export const SERVICE_TYPE_OPTIONS = [
  { value: 'BAR', label: 'Bar' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'CAR_HIRE', label: 'Car Hire' },
  { value: 'SPA', label: 'Spa' },
  { value: 'TOUR', label: 'Tour' },
];

export const serviceTypeIcons = {
  BAR: Wine,
  RESTAURANT: UtensilsCrossed,
  CAR_HIRE: Car,
  SPA: Sparkles,
  TOUR: Compass,
  LOCAL_TOUR: Compass, // tolerate the older enum spelling defensively, should it ever appear
};

export const serviceTypeLabel = (value) => SERVICE_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;

export default SERVICE_TYPE_OPTIONS;
