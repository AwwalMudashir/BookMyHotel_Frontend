import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Star, MapPin, Edit2, Eye, Trash2, Plus, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import hotelApi from '../../api/hotelApi';
import adminApi from '../../api/adminApi';
import Spinner from '../../components/core/Spinner';
import HotelFormModal from '../../components/admin/HotelFormModal';

const truncate = (text = '', length = 40) => (text.length > length ? `${text.slice(0, length)}...` : text);

const AdminHotels = () => {
	const [hotels, setHotels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [page, setPage] = useState(1);
	const [size] = useState(100);
	const [showForm, setShowForm] = useState(false);
	const [editingHotel, setEditingHotel] = useState(null);
	const [confirmDelete, setConfirmDelete] = useState(null);
	const navigate = useNavigate();

	const loadHotels = async () => {
		setLoading(true);
		setError('');
		try {
			const { items } = await hotelApi.getAllHotels(page, size);
			const data = items;
			setHotels(data);
		} catch (err) {
			setError(err.message || 'Unable to fetch hotels');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadHotels();
	}, []);

	const handleEdit = (hotel) => {
		setEditingHotel(hotel);
		setShowForm(true);
	};

	const handleDelete = async (id) => {
		try {
			await adminApi.deleteHotel(id);
			setConfirmDelete(null);
			await loadHotels();
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<AdminLayout>
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">

				<div className="mb-6 flex items-center justify-between gap-4">
					<div>
						<h1 className="font-[Playfair_Display] text-2xl font-semibold">Hotel Management</h1>
						<p className="mt-1 text-sm text-[#6B7280]">Manage all hotel chains and their branches</p>
					</div>
					<div>
						<button type="button" onClick={() => { setEditingHotel(null); setShowForm(true); }} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065E52]">
							<Plus size={14} />
							Add Hotel
						</button>
					</div>
				</div>

				<div className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-sm">
					{loading ? (
						<div className="flex items-center justify-center py-12"><Spinner /></div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
							<div className="rounded-full bg-[#E6F5F3] p-3 text-[#0A7C6E]"><RefreshCw /></div>
							<p className="text-sm text-[#6B7280]">{error}</p>
							<button onClick={loadHotels} className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white">Try again</button>
						</div>
					) : hotels.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
							<div className="rounded-full bg-[#E6F5F3] p-3 text-[#0A7C6E]"><Building2 /></div>
							<p className="text-sm text-[#6B7280]">No hotels found. Add your first hotel.</p>
							<button type="button" onClick={() => { setEditingHotel(null); setShowForm(true); }} className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white">Add Hotel</button>
						</div>
					) : (
						<div className="overflow-x-hidden">
							<table className="w-full table-auto">
								<thead>
									<tr className="text-left text-xs text-[#6B7280]">
										<th className="w-1/4 py-2">Hotel Name</th>
										<th className="w-1/6 py-2">Star</th>
										<th className="w-1/12 py-2">Branches</th>
										<th className="w-1/3 py-2">Description</th>
										<th className="w-1/12 py-2">Status</th>
										<th className="w-1/12 py-2">Actions</th>
									</tr>
								</thead>
								<tbody>
									{hotels.map((hotel) => (
										<tr key={hotel.id} className="align-top">
											<td className="py-2">
												<div className="flex items-center gap-2">
													<div className="rounded-md bg-[#E6F5F3] p-1 text-[#0A7C6E]"><Building2 size={12} /></div>
													<div className="min-w-0">
														<div className="font-medium text-sm text-[#1A1A2E] truncate">{hotel.name}</div>
													</div>
												</div>
											</td>
											<td className="py-2">
												<div className="flex items-center gap-1">
													{Array.from({ length: 5 }).map((_, idx) => (
														<Star key={idx} size={12} className={idx < Math.round(hotel.starRating) ? 'text-[#C9A84C]' : 'text-[#E5E7EB]'} />
													))}
												</div>
											</td>
											<td className="py-2">
												<div className="flex items-center gap-1 text-xs text-[#6B7280]"><MapPin size={12} />{(hotel.branches || []).length}</div>
											</td>
											<td className="py-2 text-xs text-[#6B7280] min-w-0 truncate">{truncate(hotel.description)}</td>
											<td className="py-2">
												<span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Active</span>
											</td>
											<td className="py-2">
												<div className="flex items-center gap-1">
													<button title="Edit" onClick={() => handleEdit(hotel)} className="rounded-full p-1 text-slate-600 hover:text-[#0A7C6E]">
														<Edit2 size={14} />
													</button>
													<button title="View Branches" onClick={() => navigate(`/admin/branches?hotelId=${hotel.id}`)} className="rounded-full p-1 text-slate-600 hover:text-blue-600">
														<Eye size={14} />
													</button>
													<button title="Delete" onClick={() => setConfirmDelete(hotel)} className="rounded-full p-1 text-slate-600 hover:text-red-600">
														<Trash2 size={14} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{showForm ? <HotelFormModal hotel={editingHotel} onClose={() => { setShowForm(false); loadHotels(); }} /> : null}

			{confirmDelete ? (
				<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
					<div className="w-full max-w-md rounded-2xl bg-white p-6">
						<h3 className="text-lg font-semibold">Delete hotel</h3>
						<p className="mt-2 text-sm text-[#6B7280]">Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This will remove all branches and rooms.</p>
						<div className="mt-4 flex justify-end gap-3">
							<button onClick={() => setConfirmDelete(null)} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
							<button onClick={() => handleDelete(confirmDelete.id)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">Delete</button>
						</div>
					</div>
				</div>
			) : null}
		</AdminLayout>
	);
};

export default AdminHotels;
