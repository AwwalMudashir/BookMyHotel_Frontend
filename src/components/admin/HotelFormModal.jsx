import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '../../api/adminApi';

const starValues = [1, 2, 3, 4, 5];

const HotelFormModal = ({ hotel = null, onClose = () => {} }) => {
  const isEdit = Boolean(hotel?.id);
  const [name, setName] = useState(hotel?.name || '');
  const [description, setDescription] = useState(hotel?.description || '');
  const [starRating, setStarRating] = useState(Number(hotel?.starRating ?? 0));
  const [logoUrl, setLogoUrl] = useState(hotel?.logoUrl || '');
  const [longImage, setLongImage] = useState(hotel?.longImage || '');
  const [hoverRating, setHoverRating] = useState(0);
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

  const validate = () => {
    if (!name.trim()) {
      setError('Hotel name is required.');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required.');
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
        name: name.trim(),
        description: description.trim(),
        starRating,
        logoUrl: logoUrl.trim() || undefined,
        longImage: longImage.trim() || undefined,
      };

      if (isEdit) {
        await adminApi.updateHotel(hotel.id, payload);
        toast.success('Hotel updated successfully.');
      } else {
        await adminApi.createHotel(payload);
        toast.success('Hotel created successfully.');
      }

      onClose(true);
    } catch (err) {
      setError(err.message || 'Unable to save hotel.');
      toast.error(err.message || 'Unable to save hotel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6" onClick={handleBackdropClick}>
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg transform overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl transition duration-300 ease-out motion-safe:animate-fadeIn sm:max-h-[calc(100dvh-3rem)] sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[Playfair_Display] text-2xl font-semibold text-slate-900">
              {isEdit ? 'Edit Hotel' : 'Add New Hotel'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isEdit ? 'Update hotel details and save changes.' : 'Create a new hotel record before adding branches and rooms.'}
            </p>
          </div>
          <button type="button" onClick={() => onClose()} className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="hotelName" className="mb-2 block text-sm font-medium text-slate-700">Hotel Name</label>
            <input
              id="hotelName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter hotel name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div>
            <label htmlFor="hotelDescription" className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="hotelDescription"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Provide a short description"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Star Rating</label>
            <div className="flex items-center gap-2">
              {starValues.map((value) => {
                const filled = value <= (hoverRating || starRating);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStarRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-slate-400 transition hover:text-[#C9A84C]"
                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                  >
                    <Star size={24} className={filled ? 'text-[#C9A84C]' : 'text-slate-300'} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="hotelLogoUrl" className="mb-2 block text-sm font-medium text-slate-700">Logo URL</label>
            <input
              id="hotelLogoUrl"
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div>
            <label htmlFor="hotelLongImage" className="mb-2 block text-sm font-medium text-slate-700">Long image URL</label>
            <input
              id="hotelLongImage"
              type="url"
              value={longImage}
              onChange={(event) => setLongImage(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
            <p className="mt-2 text-sm text-slate-500">This wide image is used for hotel promos and landing displays.</p>
          </div>

          {longImage ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Preview</p>
              <img src={longImage} alt="Hotel long banner" className="h-40 w-full rounded-2xl object-cover" />
            </div>
          ) : null}

          <p className="text-sm text-slate-500">
            Branches and rooms are added separately after creating the hotel.
          </p>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Hotel')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HotelFormModal;
