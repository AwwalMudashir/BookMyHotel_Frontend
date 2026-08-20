import { useState } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import userApi from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';

const HomePromoSubscription = () => {
  const { isAuthenticated, user } = useAuth();
  const [subscribedThisVisit, setSubscribedThisVisit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const subscribed = Boolean(user?.emailNotifications) || subscribedThisVisit;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast('Please sign in to save your notification preference.');
      window.dispatchEvent(new Event('auth:required'));
      return;
    }

    setIsUpdating(true);

    try {
      await userApi.updateMe({ emailNotifications: true });
      setSubscribedThisVisit(true);
      toast.success('You will receive promo notifications. You can change this anytime from your profile.');
    } catch (error) {
      toast.error(error.message || 'Unable to update your preference.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (subscribed) return null;

  return (
    <section className="mx-4 mt-6 sm:mx-4 lg:mx-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F5F3] px-3 py-1 text-sm font-medium text-[#0A7C6E]">
              <Bell size={16} />
              Promo alerts
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Stay notified about the best hotel deals.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Get notified by email when new promotions are available or when your favorite hotels add limited-time offers.
              Sign in or opt in now to make sure you don’t miss the best travel savings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isUpdating}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#0A7C6E] hover:bg-[#F2FBF9] hover:text-[#0A7C6E] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Bell size={16} />
            {isUpdating ? 'Subscribing…' : 'Opt in for promo alerts'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default HomePromoSubscription;
