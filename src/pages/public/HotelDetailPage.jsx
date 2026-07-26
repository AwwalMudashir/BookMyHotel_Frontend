import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Star, Tag, Leaf, Users, MessageCircleMore, RefreshCw } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import hotelApi from '../../api/hotelApi';
import RoomCard from '../../components/hotel/RoomCard';
import ReviewCard from '../../components/hotel/ReviewCard';
import { useAuthContext } from '../../context/AuthContext';
import reviewApi from '../../api/reviewApi';

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [hotel, setHotel] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [loading, setLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });

  useEffect(() => {
    const loadHotel = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await hotelApi.getHotelById(id);
        setHotel(data);
        const branchData = await hotelApi.getHotelBranches(id);
        setBranches(branchData);
        if (branchData[0]) {
          setSelectedBranch(branchData[0]);
        }
      } catch (err) {
        setError(err.message || 'Unable to load this hotel right now.');
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [id]);

  useEffect(() => {
    const loadBranchDetails = async () => {
      if (!selectedBranch?.id) return;

      setBranchLoading(true);
      try {
        const roomData = await hotelApi.getBranchRooms(selectedBranch.id);
        setRooms(roomData);
        setVisibleReviews(3);
        setReviewLoading(true);
        const reviewData = await hotelApi.getBranchReviews(selectedBranch.id);
        setReviews(reviewData);
      } catch (err) {
        setRooms([]);
        setReviews([]);
      } finally {
        setBranchLoading(false);
        setReviewLoading(false);
      }
    };

    loadBranchDetails();
  }, [selectedBranch]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    try {
      await reviewApi.submitReview({
        branchId: selectedBranch?.id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setShowReviewModal(false);
      setReviewForm({ rating: '5', comment: '' });
      if (selectedBranch?.id) {
        const reviewData = await hotelApi.getBranchReviews(selectedBranch.id);
        setReviews(reviewData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/hotels')}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#0A7C6E] transition hover:border-[#0A7C6E] hover:bg-[#E6F5F3]"
        >
          <ArrowLeft size={16} />
          Back to hotels
        </button>

        {loading ? (
          <div className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-8 shadow-sm">
            <div className="h-8 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
        ) : error ? (
          <div className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">{error}</p>
          </div>
        ) : hotel ? (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-[#1A2744] shadow-sm">
              <div className="relative h-[280px] bg-gradient-to-r from-[#1A2744] via-[#1A2744]/90 to-[#0A7C6E]/40 p-8 sm:p-10 lg:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_45%)]" />
                <div className="relative flex h-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
                  <div className="max-w-2xl">
                    <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/80 backdrop-blur">
                      Signature stay
                    </p>
                    <h1 className="font-[Playfair_Display] text-3xl font-bold text-white sm:text-4xl">
                      {hotel.name}
                    </h1>
                    <p className={`mt-3 text-sm leading-7 text-white/70 ${showFullDescription ? '' : 'line-clamp-2'}`}>
                      {hotel.description}
                    </p>
                    {hotel.description?.length > 140 ? (
                      <button type="button" onClick={() => setShowFullDescription((current) => !current)} className="mt-3 text-sm font-semibold text-[#E6F5F3] transition hover:text-white">
                        {showFullDescription ? 'Show less' : 'Read more'}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-[#C9A84C]" fill="#C9A84C" />
                      <span>{Number(hotel.starRating || 0).toFixed(1)}</span>
                    </div>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span>{reviews.length || 0} reviews</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {branches.map((branch) => {
                  const isActive = selectedBranch?.id === branch.id;
                  const label = branch.city ? `${branch.city}${branch.country ? ` • ${branch.country}` : ''}` : 'Branch';
                  return (
                    <button
                      key={branch.id ?? `${branch.city}-${branch.country}`}
                      type="button"
                      onClick={() => setSelectedBranch(branch)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${isActive ? 'border-[#0A7C6E] bg-[#E6F5F3] text-[#0A7C6E]' : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] hover:border-[#0A7C6E] hover:text-[#0A7C6E]'}`}
                    >
                      <MapPin size={15} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedBranch ? (
                <div className="mt-6 rounded-[24px] border border-[#E5E7EB] bg-[#F8F9FA] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{selectedBranch.city || 'Selected branch'}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">{selectedBranch.country}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-[#E6F5F3] px-3 py-1 text-sm font-medium text-[#0A7C6E]">
                      <Leaf size={14} />
                      Eco-certified property
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Address</p>
                      <p className="mt-2 text-sm text-[#1A1A2E]">{selectedBranch.address || 'Address available on request'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Check-in</p>
                      <p className="mt-2 text-sm text-[#1A1A2E]">From 15:00</p>
                    </div>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Check-out</p>
                      <p className="mt-2 text-sm text-[#1A1A2E]">By 12:00</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Available rooms</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Choose the room that fits your stay best.</p>
                </div>
                {branchLoading ? <RefreshCw size={18} className="animate-spin text-[#0A7C6E]" /> : null}
              </div>

              {!branchLoading && rooms.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center text-sm text-[#6B7280]">
                  No rooms are available for this branch right now.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((room) => (
                    <RoomCard key={room?.id ?? room?.roomId ?? room?.roomID ?? `${room?.type}-${Math.random()}`} room={room} />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Guest reviews</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">What guests said about their stay.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#E6F5F3] px-4 py-2 text-sm font-semibold text-[#0A7C6E]">
                    {reviews.length ? `${(reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)} ★` : '0.0 ★'}
                  </div>
                  {user?.role === 'CUSTOMER' ? (
                    <button type="button" onClick={() => setShowReviewModal(true)} className="flex cursor-pointer items-center gap-2 rounded-full border border-[#0A7C6E] px-4 py-2 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]">
                      <MessageCircleMore size={16} />
                      Write a review
                    </button>
                  ) : null}
                </div>
              </div>

              {reviewLoading ? (
                <div className="mt-6 rounded-[24px] border border-[#E5E7EB] bg-[#F8F9FA] p-6 text-sm text-[#6B7280]">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center text-sm text-[#6B7280]">
                  No reviews yet for this branch.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {reviews.slice(0, visibleReviews).map((review) => (
                    <ReviewCard key={review?.id ?? `${review?.reviewerName}-${Math.random()}`} review={review} />
                  ))}
                  {visibleReviews < reviews.length ? (
                    <button type="button" onClick={() => setVisibleReviews((current) => current + 3)} className="mx-auto mt-2 inline-flex cursor-pointer items-center rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]">
                      Load more
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default HotelDetailPage;
