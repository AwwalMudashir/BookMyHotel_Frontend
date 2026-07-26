import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import roomApi from '../../api/roomApi';

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential Suite'];
const currencies = ['GBP', 'USD', 'EUR', 'JPY', 'SGD', 'THB', 'HKD', 'SAR', 'TRY', 'AED'];

const RoomFormModal = ({ branchId, room = null, onClose = () => {} }) => {
  const isEdit = Boolean(room?.id);
  const [type, setType] = useState(room?.type || 'Standard');
  const [description, setDescription] = useState(room?.description || '');
  const [maxOccupancy, setMaxOccupancy] = useState(room?.maxOccupancy ?? 1);
  const [price, setPrice] = useState(room?.price ?? 0);
  const [currency, setCurrency] = useState(room?.currency || 'GBP');
  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState(Array.isArray(room?.amenities) ? room.amenities : []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleAmenityKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const trimmed = amenityInput.trim();
    if (!trimmed) return;
    if (!amenities.includes(trimmed)) {
      setAmenities((current) => [...current, trimmed]);
    }
    setAmenityInput('');
  };

  const handleRemoveAmenity = (value) => {
    setAmenities((current) => current.filter((item) => item !== value));
  };

  const validate = () => {
    if (!type) {
      setError('Room type is required.');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return false;
    }
    if (!branchId && !isEdit) {
      setError('Branch is required to create a room.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        roomType: type,
        description: description.trim(),
        maxOccupancy: Number(maxOccupancy),
        price: Number(price),
        currency,
        amenities,
        branchId,
      };

      if (isEdit) {
        await roomApi.updateRoom(room.id, payload);
        toast.success('Room updated successfully.');
      } else {
        await roomApi.createRoom(payload);
        toast.success('Room created successfully.');
      }

      onClose(true);
    } catch (err) {
      setError(err.message || 'Unable to save room.');
      toast.error(err.message || 'Unable to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition duration-300 ease-out motion-safe:animate-fadeIn" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[Playfair_Display] text-2xl font-semibold text-slate-900">
              {isEdit ? 'Edit Room' : 'Add New Room'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isEdit ? 'Update room details and save changes.' : 'Add a new room to the selected branch.'}
            </p>
          </div>
          <button type="button" onClick={() => onClose()} className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="roomType" className="mb-2 block text-sm font-medium text-slate-700">Room Type</label>
            <select
              id="roomType"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            >
              {roomTypes.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="roomDescription" className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="roomDescription"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the room"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="maxOccupancy" className="mb-2 block text-sm font-medium text-slate-700">Max Occupancy</label>
              <input
                id="maxOccupancy"
                type="number"
                min={1}
                max={10}
                value={maxOccupancy}
                onChange={(event) => setMaxOccupancy(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-medium text-slate-700">Price Per Night</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min={0}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="currency" className="mb-2 block text-sm font-medium text-slate-700">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            >
              {currencies.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amenityInput" className="mb-2 block text-sm font-medium text-slate-700">Amenities</label>
            <div className="flex flex-col gap-3">
              <input
                id="amenityInput"
                type="text"
                value={amenityInput}
                onChange={(event) => setAmenityInput(event.target.value)}
                onKeyDown={handleAmenityKeyDown}
                placeholder="Add an amenity and press Enter"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span key={amenity} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {amenity}
                    <button type="button" onClick={() => handleRemoveAmenity(amenity)} className="rounded-full p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Room')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
