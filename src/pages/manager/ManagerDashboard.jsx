import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import authApi from '../../api/authApi';

const managerLinks = [
	{ to: '/manager/property', label: 'Property' },
	{ to: '/manager/rates', label: 'Rates' },
	{ to: '/manager/availability', label: 'Availability' },
	{ to: '/manager/services', label: 'Services' },
	{ to: '/manager/promotions', label: 'Promotions' },
	{ to: '/manager/opportunities', label: 'Opportunities' },
	{ to: '/manager/reservations', label: 'Reservations' },
];

const ManagerDashboard = () => {
	const { role } = useAuth();
	const isAdmin = role === 'ADMIN';

	const [creating, setCreating] = useState(null); // 'admin' | 'hotelManager' | null
	const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', hotelId: '' });

	const openForm = (type) => {
		setCreating(type);
		setForm({ firstName: '', lastName: '', email: '', password: '', hotelId: '' });
	};

	const closeForm = () => setCreating(null);

	const handleChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (creating === 'admin') {
				await authApi.registerAdmin({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
				toast.success('Admin account created');
			} else if (creating === 'hotelManager') {
				await authApi.registerHotelManager({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, hotelId: Number(form.hotelId) });
				toast.success('Hotel manager account created');
			}
			closeForm();
		} catch (err) {
			toast.error(err.message || 'Unable to create account');
		}
	};

	return (
		<div className="p-6 fade-in">
			<h1 className="text-2xl font-semibold text-slate-900">Manager dashboard</h1>
			<p className="mt-2 text-sm text-slate-600">Overview and management tools for your property.</p>

			{isAdmin ? (
				<div className="mt-6 flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => openForm('admin')}
						className="rounded-2xl border border-[#0A7C6E] bg-white px-4 py-2 text-sm font-semibold text-[#0A7C6E] hover:bg-[#E6F5F3]"
					>
						Create Admin
					</button>
					<button
						type="button"
						onClick={() => openForm('hotelManager')}
						className="rounded-2xl border border-[#0A7C6E] bg-white px-4 py-2 text-sm font-semibold text-[#0A7C6E] hover:bg-[#E6F5F3]"
					>
						Create Hotel Manager
					</button>
				</div>
			) : (
				<div className="mt-6 flex flex-wrap gap-3">
					{managerLinks.map(({ to, label }) => (
						<Link
							key={to}
							to={to}
							className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]"
						>
							{label}
						</Link>
					))}
				</div>
			)}

			{creating ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
						<div className="flex items-start justify-between">
							<div>
								<h2 className="text-lg font-semibold text-slate-900">{creating === 'admin' ? 'Create Admin' : 'Create Hotel Manager'}</h2>
								<p className="mt-1 text-sm text-slate-500">Fill the details to create an account.</p>
							</div>
							<button type="button" onClick={closeForm} className="text-slate-500">✕</button>
						</div>

						<form className="mt-4 space-y-4" onSubmit={handleSubmit}>
							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
								<input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm outline-none" />
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
								<input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm outline-none" />
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
								<input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm outline-none" />
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
								<input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm outline-none" />
							</div>
							{creating === 'hotelManager' && (
								<div>
									<label className="mb-2 block text-sm font-medium text-slate-700">Hotel ID</label>
									<input type="number" value={form.hotelId} onChange={(e) => handleChange('hotelId', e.target.value)} className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm outline-none" />
								</div>
							)}

							<div className="mt-4 flex items-center justify-end gap-3">
								<button type="button" onClick={closeForm} className="rounded-2xl bg-white px-4 py-2 text-sm border">Cancel</button>
								<button type="submit" className="rounded-2xl bg-[#0A7C6E] px-4 py-2 text-sm text-white">Create</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default ManagerDashboard;
