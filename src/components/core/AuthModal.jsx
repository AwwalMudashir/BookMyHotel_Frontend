import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import authApi from '../../api/authApi';
import userApi from '../../api/userApi';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false,
};

const AuthModal = ({
  isOpen = false,
  onClose = () => {},
  initialMode = 'login',
  onSubmit = () => {},
  onForgotPassword = () => {},
  successMessage = '',
  imageUrl = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
}) => {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [otpEntryId, setOtpEntryId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return;

    setMode(initialMode);
    setStep('form');
    setFormData(emptyForm);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
    setOtpDigits(Array(6).fill(''));
    setOtpEntryId(null);
    setFeedback({ type: '', message: '' });
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || !successMessage) return;

    if (mode === 'login') {
      setFeedback({ type: 'success', message: successMessage });
    }
  }, [isOpen, mode, successMessage]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }

    if (mode === 'signup') {
      if (!formData.firstName.trim()) {
        nextErrors.firstName = 'First name is required.';
      }

      if (!formData.lastName.trim()) {
        nextErrors.lastName = 'Last name is required.';
      }

      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateResetPassword = () => {
    const nextErrors = {};

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ mode, ...formData });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    setStep('form');
    setErrors({});
    setFeedback({ type: '', message: '' });
    setOtpDigits(Array(6).fill(''));
  };

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.forgotPassword(formData.email.trim());
      setOtpEntryId(response?.entryId ?? null);
      setOtpDigits(Array(6).fill(''));
      setFeedback({ type: 'success', message: response?.message || 'OTP sent successfully.' });
      setStep('otp');
      toast.success(response?.message || 'OTP sent successfully.');
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to send OTP.' });
      toast.error(error.message || 'Unable to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const nextDigits = [...otpDigits];
    const sanitizedValue = value.replace(/\D/g, '').slice(-1);
    nextDigits[index] = sanitizedValue;
    setOtpDigits(nextDigits);

    if (sanitizedValue && index < otpDigits.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const nextDigits = [...otpDigits];
      nextDigits[index - 1] = '';
      setOtpDigits(nextDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      setFeedback({ type: 'error', message: 'Please enter the full 6-digit code.' });
      return;
    }

    if (!otpEntryId || !formData.email.trim()) {
      setFeedback({ type: 'error', message: 'Verification details are missing.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.verifyOtp({
        entryId: otpEntryId,
        email: formData.email.trim(),
        otpValue,
        otp: otpValue,
        otpCode: otpValue,
        code: otpValue,
      });

      if (response?.success) {
        toast.success(response.message || 'OTP verified successfully.');
        setStep('reset');
        setMode('login');
        setFeedback({ type: 'success', message: response.message || 'OTP verified successfully. Please choose a new password.' });
        setFormData((current) => ({ ...current, password: '', confirmPassword: '' }));
        setOtpDigits(Array(6).fill(''));
        setErrors({});
      } else {
        setFeedback({ type: 'error', message: response?.message || 'OTP verification failed.' });
        toast.error(response?.message || 'OTP verification failed.');
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to verify OTP.' });
      toast.error(error.message || 'Unable to verify OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (event) => {
    event.preventDefault();

    if (!validateResetPassword()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await userApi.resetPassword({
        email: formData.email.trim(),
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response?.success || response?.message) {
        toast.success(response?.message || 'Password reset successfully.');
        setFeedback({ type: 'success', message: response?.message || 'Password reset successfully.' });
        setStep('form');
        setMode('login');
        setFormData((current) => ({ ...current, password: '', confirmPassword: '' }));
        setErrors({});
      } else {
        setFeedback({ type: 'error', message: response?.message || 'Unable to reset password.' });
        toast.error(response?.message || 'Unable to reset password.');
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to reset password.' });
      toast.error(error.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your email first.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.resendOtp(formData.email.trim());
      setOtpDigits(Array(6).fill(''));
      setFeedback({ type: 'success', message: response?.message || 'A new OTP has been sent.' });
      toast.success(response?.message || 'A new OTP has been sent.');
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to resend OTP.' });
      toast.error(error.message || 'Unable to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToLogin = () => {
    setStep('form');
    setMode('login');
    setErrors({});
    setFeedback({ type: '', message: '' });
    setOtpDigits(Array(6).fill(''));
  };

  const renderFeedback = () => {
    if (!feedback.message) return null;

    const baseClasses = 'rounded-2xl border px-3 py-2 text-sm';
    const classes = feedback.type === 'error'
      ? `${baseClasses} border-rose-200 bg-rose-50 text-rose-700`
      : `${baseClasses} border-emerald-200 bg-emerald-50 text-emerald-700`;

    return <div className={classes}>{feedback.message}</div>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 lg:px-6">
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        <div className="hidden w-[38%] flex-shrink-0 md:block">
          <div className="relative h-full min-h-[440px] overflow-hidden">
            <img src={imageUrl} alt="Luxury travel and hospitality illustration" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A7C6E]/80 via-[#0A7C6E]/40 to-slate-950/70" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-6">
              <p className="mb-3 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] backdrop-blur">
                BookMyHotel
              </p>
              <h2 className="text-3xl font-semibold leading-tight">
                Discover stays designed for effortless travel.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-100/90">
                Join thousands of travelers booking premium stays with trusted hospitality and seamless experiences.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">
            <div className="mb-5">
              <p className="mb-3 inline-flex rounded-full bg-[#0A7C6E]/10 px-3 py-1 text-sm font-medium text-[#0A7C6E]">
                {step === 'forgot' ? 'Reset password' : step === 'otp' ? 'Verify email' : step === 'reset' ? 'Choose a new password' : mode === 'login' ? 'Welcome back' : 'Create your account'}
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 sm:text-[1.55rem]">
                {step === 'forgot' ? 'Enter your email' : step === 'otp' ? 'Enter the 6-digit code' : step === 'reset' ? 'Set a new password' : mode === 'login' ? 'Log in to your account' : 'Sign up for a new account'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step === 'forgot'
                  ? 'We will send a one-time password to your email so you can recover your account.'
                  : step === 'otp'
                    ? 'Enter the verification code we just sent to your inbox.'
                    : step === 'reset'
                      ? 'Choose a strong password for your account and confirm it below.'
                      : mode === 'login'
                        ? 'Access your dashboard, bookings, and saved stays in seconds.'
                        : 'Start exploring premium stays and personalized travel experiences.'}
              </p>
            </div>

            {step === 'forgot' && (
              <form className="space-y-3" onSubmit={handleForgotPasswordSubmit} noValidate>
                {renderFeedback()}
                <div>
                  <label htmlFor="forgotEmail" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="forgotEmail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                  />
                  {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A7C6E]/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="w-full cursor-pointer text-sm font-medium text-[#0A7C6E] transition hover:text-[#0A7C6E]/80"
                >
                  Back to login
                </button>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                {renderFeedback()}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      className="h-12 w-11 rounded-2xl border border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20 sm:h-14 sm:w-12"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleOtpSubmit}
                  disabled={isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A7C6E]/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                  <ArrowRight size={16} />
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="cursor-pointer font-medium text-[#0A7C6E] transition hover:text-[#0A7C6E]/80 disabled:opacity-60"
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={goBackToLogin}
                    className="cursor-pointer font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <form className="space-y-3" onSubmit={handlePasswordResetSubmit} noValidate>
                {renderFeedback()}
                <div className="relative">
                  <label htmlFor="resetPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    New password
                  </label>
                  <input
                    id="resetPassword"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter a new password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-[42px] cursor-pointer text-slate-500 transition hover:text-slate-900"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                </div>

                <div className="relative">
                  <label htmlFor="resetConfirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm new password
                  </label>
                  <input
                    id="resetConfirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your new password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-[42px] cursor-pointer text-slate-500 transition hover:text-slate-900"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A7C6E]/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Resetting password...' : 'Reset password'}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="w-full cursor-pointer text-sm font-medium text-slate-600 transition hover:text-slate-900"
                >
                  Back to login
                </button>
              </form>
            )}

            {step === 'form' && (
              <>
                <form className="space-y-2.5" onSubmit={handleSubmit} noValidate>
                  {renderFeedback()}
                  {mode === 'signup' && (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">
                          First name
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Cristiano"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                        />
                        {errors.firstName && <p className="mt-2 text-sm text-rose-600">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                          Last name
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Ronaldo"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                        />
                        {errors.lastName && <p className="mt-2 text-sm text-rose-600">{errors.lastName}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                    />
                    {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                  </div>

                  <div className="relative">
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter a strong password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-[42px] cursor-pointer text-slate-500 transition hover:text-slate-900"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                  </div>

                  {mode === 'signup' && (
                    <div className="relative">
                      <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                        Confirm password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute right-3 top-[42px] cursor-pointer text-slate-500 transition hover:text-slate-900"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {errors.confirmPassword && <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A7C6E] focus:ring-[#0A7C6E]"
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot');
                          setFeedback({ type: '', message: '' });
                          onForgotPassword();
                        }}
                        className="font-medium text-[#0A7C6E] cursor-pointer transition hover:text-[#0A7C6E]/80"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A7C6E]/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Log in' : 'Create account')}
                    <ArrowRight size={16} />
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                  {mode === 'login' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => handleModeSwitch('signup')} className="font-semibold cursor-pointer text-[#0A7C6E] transition hover:text-[#0A7C6E]/80">
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => handleModeSwitch('login')} className="font-semibold cursor-pointer text-[#0A7C6E] transition hover:text-[#0A7C6E]/80">
                        Login
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
