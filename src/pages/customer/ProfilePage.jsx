import { useEffect, useMemo, useState } from 'react';
import { Leaf, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { TailSpin } from 'react-loader-spinner';
import userApi from '../../api/userApi';
import Navbar from '../../components/core/Navbar';
import { useAuth } from '../../hooks/useAuth';

const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'rewards', label: 'Eco Rewards', icon: Leaf },
];

const getPasswordStrength = (value) => {
    const checks = [
        { label: '8+ chars', test: value.length >= 8 },
        { label: 'Number', test: /\d/.test(value) },
        { label: 'Uppercase', test: /[A-Z]/.test(value) },
        { label: 'Special', test: /[^A-Za-z0-9]/.test(value) },
    ];

    const score = checks.filter((item) => item.test).length;
    const color = score <= 1 ? 'bg-rose-400' : score <= 2 ? 'bg-amber-400' : score <= 3 ? 'bg-emerald-400' : 'bg-teal-600';
    return { checks, score, color };
};

const ProfilePage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', gender: '' });
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwordError, setPasswordError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [otpStep, setOtpStep] = useState('request');
    const [otpValue, setOtpValue] = useState('');
    const [otpEntryId, setOtpEntryId] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(passwords.newPassword), [passwords.newPassword]);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                const response = await userApi.getMe();
                if (isMounted) {
                    setProfile(response);
                    setForm({
                        firstName: response?.firstName || response?.first_name || '',
                        lastName: response?.lastName || response?.last_name || '',
                        email: response?.email || '',
                        gender: response?.gender || response?.Gender || '',
                    });
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Unable to load your profile right now.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    const validateForm = () => {
        const nextErrors = {};
        if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
        if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        setError('');

        try {
            const payload = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                gender: form.gender || null,
            };
            await userApi.updateMe(payload);
            toast.success('Your profile details were updated.');
        } catch (err) {
            setError(err.message || 'We could not update your profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleSendOtp = async () => {
        if (!form.email) {
            toast.error('Your email is required to receive the verification code.');
            return;
        }

        setOtpLoading(true);

        try {
            const response = await userApi.sendOtp(form.email);
            const nextEntryId = response?.entryId || response?.entry_id || response?.id || '';
            if (!nextEntryId) {
                throw new Error('The server did not return an entry id for the OTP request.');
            }
            setOtpEntryId(nextEntryId);
            setOtpStep('verify');
            setOtpValue('');
            setOtpVerified(false);
            toast.success('A verification code has been sent to your email.');
        } catch (err) {
            toast.error(err.message || 'We could not send the verification code.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpValue.trim()) {
            toast.error('Please enter the OTP code sent to your email.');
            return;
        }

        setOtpLoading(true);

        try {
            const otpCode = otpValue.trim();
            await userApi.verifyOtp({
                entryId: otpEntryId,
                email: form.email,
                otpValue: otpCode,
            });

            setOtpStep('reset');
            setOtpValue('');
            setOtpVerified(true);
            toast.success('OTP verified successfully.');
        } catch (err) {
            toast.error(err.message || 'The verification code is invalid.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        setPasswordError('');

        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            toast.error('Please fill in all password fields.');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }

        if (passwordStrength.score < 3) {
            toast.error('Choose a stronger password with at least 3 strength checks.');
            return;
        }

        if (!otpVerified || otpStep !== 'reset') {
            toast.error('Please verify your email with the OTP first.');
            return;
        }

        try {
            await userApi.resetPassword({
                oldPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success('Your password has been updated.');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setOtpValue('');
            setOtpEntryId('');
            setOtpStep('request');
            setOtpVerified(false);
        } catch (err) {
            toast.error(err.message || 'We could not update your password.');
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex min-h-105 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                        <TailSpin height={36} width={36} color="#0A7C6E" ariaLabel="Loading" />
                        <p className="text-sm">Loading your account details…</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0A7C6E] text-xl font-semibold text-white">
                            {(profile?.firstName || profile?.first_name || user?.firstName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-slate-900">
                            {(profile?.firstName || profile?.first_name || '') + ' ' + (profile?.lastName || profile?.last_name || '') || 'Your account'}
                        </h2>
                        <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            {profile?.role || user?.role || 'Customer'}
                        </div>
                    </div>

                    <nav className="mt-8 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${isActive ? 'bg-[#E6F5F3] text-[#0A7C6E]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {activeTab === 'personal' && (
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">Personal Information</p>
                                <h3 className="text-2xl font-semibold text-slate-900">Keep your details polished and up to date</h3>
                                <p className="text-sm leading-6 text-slate-600">Your name and contact details will be reflected across your bookings and account preferences.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">First Name</label>
                                    <input
                                        value={form.firstName}
                                        onChange={(event) => {
                                            setForm({ ...form, firstName: event.target.value });
                                            if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: '' }));
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/20"
                                    />
                                    {formErrors.firstName && <p className="mt-2 text-sm text-rose-600">{formErrors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Last Name</label>
                                    <input
                                        value={form.lastName}
                                        onChange={(event) => {
                                            setForm({ ...form, lastName: event.target.value });
                                            if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: '' }));
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/20"
                                    />
                                    {formErrors.lastName && <p className="mt-2 text-sm text-rose-600">{formErrors.lastName}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <span>Email Address</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Read-only</span>
                                </label>
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500">
                                    <span>{form.email}</span>
                                    <Lock className="ml-auto h-4 w-4" />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Email cannot be changed.</p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                                <select
                                    value={form.gender}
                                    onChange={(event) => setForm({ ...form, gender: event.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/20"
                                >
                                    <option value="">Select gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center justify-center rounded-full bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A5F56] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">Change Password</p>
                                <h3 className="text-2xl font-semibold text-slate-900">Secure your account with a fresh password</h3>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Secure your account with email verification</p>
                                        <p className="text-sm text-slate-600">We’ll send a one-time code to {form.email || 'your email address'} before the password reset is completed.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={otpLoading}
                                        className="rounded-full cursor-pointer border border-[#0A7C6E] px-4 py-2 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {otpLoading ? 'Sending…' : otpStep === 'verify' ? 'Resend Code' : 'Send OTP'}
                                    </button>
                                </div>
                            </div>

                            {otpStep === 'verify' && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Enter verification code</label>
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <input
                                            value={otpValue}
                                            onChange={(event) => setOtpValue(event.target.value)}
                                            placeholder="Enter 6-digit code"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={otpLoading}
                                            className="rounded-full cursor-pointer bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A5F56] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {otpLoading ? 'Checking…' : 'Verify OTP'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => {
                                const label = field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password';
                                const isVisible = showPasswords[field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm'];
                                return (
                                    <div key={field}>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
                                        <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-[#0A7C6E] focus-within:ring-2 focus-within:ring-[#0A7C6E]/20">
                                            <input
                                                type={isVisible ? 'text' : 'password'}
                                                value={passwords[field]}
                                                onChange={(event) => setPasswords({ ...passwords, [field]: event.target.value })}
                                                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, [field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm']: !isVisible })}
                                                className="ml-2 text-slate-500"
                                            >
                                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex gap-2">
                                    {passwordStrength.checks.map((item, index) => (
                                        <div key={item.label} className={`h-2 flex-1 rounded-full ${index < passwordStrength.score ? passwordStrength.color : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                                <p className="mt-3 text-sm text-slate-600">Use at least 8 characters, one number, one uppercase, and one special character.</p>
                            </div>

                            {passwordError && (
                                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!otpVerified}
                                className="inline-flex items-center justify-center rounded-full bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A5F56] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {otpVerified ? 'Change Password' : 'Verify OTP First'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="space-y-6">
                            <div className="rounded-3xl border border-[#DCEFEA] bg-[#E6F5F3] p-6 sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A7C6E] text-white">
                                        <Leaf className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">Eco reward points</p>
                                        <h3 className="text-2xl font-semibold text-slate-900">{profile?.ecoPoints ?? user?.ecoPoints ?? 0}</h3>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm font-medium text-slate-700">
                                    You earn points automatically whenever a booking at an eco-friendly room is confirmed — the more sustainable
                                    stays you book, the higher this total climbs.
                                </p>

                                <div className="mt-6 rounded-2xl border border-[#D9EBDD] bg-[#F7FCF8] px-4 py-3 text-sm text-slate-600">
                                    This is a running score, not a balance to spend — there's nothing to redeem it for yet. Look out for the
                                    "Eco-friendly" tag on room listings to keep earning.
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <div className="mx-auto max-w-6xl mt-10 ">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
