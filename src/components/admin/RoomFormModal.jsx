import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import roomApi from '../../api/roomApi';
import { ROOM_TAG_OPTIONS } from '../../utils/roomTags';
import { useCurrency } from '../../hooks/useCurrency';

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential Suite'];

const RoomFormModal = ({ branchId, room = null, onClose = () => {} }) => {
  const isEdit = Boolean(room?.id);
  const [type, setType] = useState(room?.type || room?.roomTypeName || room?.roomType || 'Standard');
  const [description, setDescription] = useState(room?.description || room?.roomDescription || '');
  const [maxOccupancy, setMaxOccupancy] = useState(
    room?.maxOccupancy ?? room?.max_occupancy ?? room?.occupancy ?? 1
  );
  const [price, setPrice] = useState(() => {
    const p = room?.price ?? room?.pricePerNight ?? room?.price_per_night ?? room?.pricePerNight;
    return (p !== undefined && p !== null && !Number.isNaN(Number(p))) ? Number(p) : 0;
  });
  const [currency, setCurrency] = useState(room?.currency || room?.branchCurrency || 'USD');
  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState(() => {
    const a = room?.amenities;
    if (Array.isArray(a)) return a;
    if (a && typeof a === 'object') return Object.keys(a);
    return [];
  });
  const [tags, setTags] = useState(Array.isArray(room?.tags) ? room.tags : []);
  const [images, setImages] = useState(Array.isArray(room?.images) ? room.images : []); // URLs
  const [publicIds, setPublicIds] = useState(Array.isArray(room?.publicIds) ? room.publicIds : []);
  const [newFiles, setNewFiles] = useState([]); // File objects to upload
  const [newImageUrls, setNewImageUrls] = useState([]); // externally provided image URLs to add
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { rates, supportedCurrencies } = useCurrency();
  const currencyOptions = supportedCurrencies.length > 0 ? supportedCurrencies : Object.keys(rates || {}).sort();
  const unsupportedCurrentCurrency = Boolean(currency && currencyOptions.length > 0 && !currencyOptions.includes(currency));

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

  // If we were passed a minimal room object (from branch list), fetch full details
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isEdit || (room?.images && room?.images.length)) return;
      try {
        const detail = await roomApi.getRoomById(room.id);
        if (cancelled) return;
        setImages(detail.images || []);
        setPublicIds(detail.publicIds || []);
        setType(detail.roomTypeName || type);
        setDescription(detail.description || description);
        setPrice(detail.pricePerNight ?? price);
        setCurrency(detail.currency || currency);
        // normalize amenities: backend stores Map<String,Object>, frontend UI expects array of keys
        if (Array.isArray(detail.amenities)) {
          setAmenities(detail.amenities);
        } else if (detail.amenities && typeof detail.amenities === 'object') {
          setAmenities(Object.keys(detail.amenities));
        }
        setTags(Array.isArray(detail.tags) ? detail.tags : tags);
      } catch {
        // Keep the summary data already supplied by the room list.
      }
    };
    load();
    return () => { cancelled = true; };
  // Fetch once for the room that opened this modal; subsequent edits are local form state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const toggleTag = (value) => {
    setTags((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setNewFiles((current) => [...current, ...files]);
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    // basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Invalid image URL');
      return;
    }
    setNewImageUrls((current) => [...current, url]);
    setImageUrlInput('');
    setError('');
  };

  const handleRemoveNewUrl = (index) => {
    setNewImageUrls((current) => current.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (idx) => {
    // support deleting both cloudinary-backed images (with publicId) and externally added URLs
    const pid = publicIds?.[idx];
    const imgUrl = images?.[idx];
    if (!pid && !imgUrl) return; // nothing to delete
    const roomId = room?.id;
    try {
      if (pid) {
        await roomApi.deleteRoomImage(branchId, roomId, pid, undefined);
      } else {
        await roomApi.deleteRoomImage(branchId, roomId, undefined, imgUrl);
      }
      // remove from local arrays (both may exist)
      setPublicIds((current) => (current ? current.filter((_, i) => i !== idx) : current));
      setImages((current) => (current ? current.filter((_, i) => i !== idx) : current));
    } catch (err) {
      toast.error(err?.message || 'Unable to delete image.');
    }
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
    if (!currencyOptions.includes(currency)) {
      setError('Choose a currency supported by the live exchange-rate provider.');
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
        // convert amenities array into a map/object expected by backend DTO (Map<String,Object>)
        const amenitiesObj = {};
        if (Array.isArray(amenities)) {
          amenities.forEach((a) => { amenitiesObj[a] = true; });
        }

        const payload = {
          roomTypeId: null, // roomApi accepts room fields — keep compatibility with backend DTOs
          roomType: type,
          description: description.trim(),
          maxOccupancy: Number(maxOccupancy),
          pricePerNight: Number(price),
          currency,
          amenities: amenitiesObj,
          tags,
      };

        // attach new files for multipart upload
        const filesToUpload = newFiles;

        try {
          if (isEdit) {
            // updateRoom(branchId, id, payload). include any new external image URLs
            await roomApi.updateRoom(branchId, room.id, { ...payload, images: filesToUpload, imageUrls: newImageUrls });
            toast.success('Room updated successfully.');
            // construct a local updated room object to reflect changes immediately in the parent list
            const updatedRoomLocal = {
              ...room,
              pricePerNight: payload.pricePerNight,
              currency: payload.currency,
              roomTypeName: payload.roomType,
              description: payload.description,
              amenities: payload.amenities,
              tags: payload.tags,
            };
            onClose(true, updatedRoomLocal);
          } else {
            // createRoom(branchId, payload)
            await roomApi.createRoom(branchId, { ...payload, images: filesToUpload, imageUrls: newImageUrls });
            toast.success('Room created successfully.');
            onClose(true, null);
          }
        } catch (err) {
          setError(err.message || 'Unable to save room.');
          toast.error(err.message || 'Unable to save room.');
        } finally {
          setIsSubmitting(false);
        }
    } catch (err) {
      setError(err.message || 'Unable to save room.');
      toast.error(err.message || 'Unable to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6" onClick={handleBackdropClick}>
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl transform overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl transition duration-300 ease-out motion-safe:animate-fadeIn sm:max-h-[calc(100dvh-3rem)]" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 pt-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-[Playfair_Display] text-2xl font-semibold text-slate-900">
                {isEdit ? 'Edit Room' : 'Add New Room'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {isEdit ? 'Update room details and save changes.' : 'Add a new room to the selected branch.'}
              </p>
            </div>
            <button type="button" onClick={() => onClose()} className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 max-h-[72vh] overflow-auto pr-3">
            {/* Room type */}
            <div className="lg:col-span-1">
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

            {/* Description spans full width */}
            <div className="lg:col-span-2">
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

            {/* Occupancy */}
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

            {/* Price */}
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

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="mb-2 block text-sm font-medium text-slate-700">Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(event) => {
                  const newCurr = event.target.value;
                  // Attempt to convert existing numeric price from current currency -> new currency
                  try {
                    const oldCurr = currency;
                    // rates is an object like { USD: 1, GBP: 0.79, ... }
                    if (!rates) throw new Error('Rates unavailable');
                    const from = (oldCurr || '').toUpperCase();
                    const to = (newCurr || '').toUpperCase();
                    if (!from || !to || !(from in rates) || !(to in rates)) {
                      throw new Error('Unsupported currency');
                    }
                    const numeric = Number(price);
                    if (Number.isNaN(numeric)) throw new Error('Invalid price');
                    const usd = numeric / rates[from];
                    const converted = usd * rates[to];
                    // Round to two decimals
                    const rounded = Math.round((converted + Number.EPSILON) * 100) / 100;
                    setPrice(rounded);
                    setCurrency(newCurr);
                  } catch {
                    // A legacy unsupported currency must still be repairable. Keep the numeric
                    // value and ask the manager to review it after choosing a supported code.
                    if (currencyOptions.includes(newCurr)) {
                      setCurrency(newCurr);
                      toast('Currency changed without conversion. Please review the nightly price.', { icon: '⚠️' });
                    } else {
                      toast.error('Conversion unavailable — please use another currency');
                    }
                  }
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              >
                {unsupportedCurrentCurrency ? <option value={currency} disabled>{currency} (unsupported — select another)</option> : null}
                {currencyOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Amenities span two columns for more space */}
            <div className="lg:col-span-2">
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

            {/* Tags span full width */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Stay tags</label>
              <div className="flex flex-wrap gap-2">
                {ROOM_TAG_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-[#0A7C6E]/40"
                  >
                    <input
                      type="checkbox"
                      checked={tags.includes(value)}
                      onChange={() => toggleTag(value)}
                      className="h-4 w-4 cursor-pointer accent-[#0A7C6E]"
                    />
                    <Icon className="h-4 w-4 text-[#0A7C6E]" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Images area spans full width */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Images</label>
              <div className="mb-3 grid grid-cols-6 gap-3">
                {images.map((src, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border col-span-1">
                    <img src={src} alt={`room-${idx}`} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => handleDeleteExistingImage(idx)} title="Delete image" className="absolute top-1 right-1 rounded-full bg-white p-1 text-rose-600 shadow">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {newFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative rounded-lg overflow-hidden border col-span-1">
                    <img src={URL.createObjectURL(file)} alt={`new-${idx}`} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => handleRemoveNewFile(idx)} title="Remove" className="absolute top-1 right-1 rounded-full bg-white p-1 text-rose-600 shadow">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {newImageUrls.map((url, idx) => (
                  <div key={`url-${idx}`} className="relative rounded-lg overflow-hidden border col-span-1">
                    <img src={url} alt={`url-${idx}`} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => handleRemoveNewUrl(idx)} title="Remove URL" className="absolute top-1 right-1 rounded-full bg-white p-1 text-rose-600 shadow">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-700 col-span-1">
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  Add images
                </label>
              </div>

              {/* Add external image URL input */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste image URL and click Add"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none"
                />
                <button type="button" onClick={handleAddImageUrl} className="rounded-2xl bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white">Add</button>
              </div>
            </div>

            {error ? <p className="lg:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex cursor-pointer w-full items-center justify-center rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Room')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomFormModal;
