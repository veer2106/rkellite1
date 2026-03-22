import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    CalendarDaysIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    UserIcon,
    HomeModernIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    BanknotesIcon,
    PhoneIcon,
    EnvelopeIcon,
    FunnelIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
    confirmed: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
    'checked-in': 'bg-green-100 text-green-800 ring-1 ring-green-200',
    'checked-out': 'bg-gray-100 text-gray-800 ring-1 ring-gray-200',
    cancelled: 'bg-red-100 text-red-800 ring-1 ring-red-200',
    'no-show': 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
};

const PAYMENT_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-purple-100 text-purple-800',
};

const initialFormState = {
    roomId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestAddress: '',
    numberOfGuests: 1,
    checkInDate: '',
    checkOutDate: '',
    advancePayment: '',
    specialRequests: '',
};

const Bookings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [form, setForm] = useState(initialFormState);
    const [formLoading, setFormLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [calculatedNights, setCalculatedNights] = useState(0);
    const [calculatedTotal, setCalculatedTotal] = useState(0);
    const [activeTab, setActiveTab] = useState('all');

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/bookings');
            setBookings(data.data || []);
        } catch (error) {
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/bookings/stats/overview');
            setStats(data.data);
        } catch (error) {
            console.error('Failed to fetch booking stats');
        }
    }, []);

    const fetchAvailableRooms = useCallback(async () => {
        try {
            const { data } = await api.get('/rooms', { params: { status: 'available' } });
            setRooms(data.data || []);
        } catch (error) {
            toast.error('Failed to fetch rooms');
        }
    }, []);

    const openCreateModal = useCallback((preselectedRoomId = '') => {
        setForm({ ...initialFormState, roomId: preselectedRoomId });
        setCalculatedNights(0);
        setCalculatedTotal(0);
        fetchAvailableRooms();
        setShowCreateModal(true);
    }, [fetchAvailableRooms]);

    useEffect(() => {
        fetchBookings();
        fetchStats();
    }, [fetchBookings, fetchStats]);

    // Auto-open modal if navigated from Rooms page with a roomId
    useEffect(() => {
        if (location.state?.openModal) {
            const preselectedRoomId = location.state.roomId || '';
            openCreateModal(preselectedRoomId);
            // Clear location state so modal doesn't re-open on back navigation
            window.history.replaceState({}, document.title);
        }
    }, [location.state, openCreateModal]);

    // Recalculate nights & total when dates or room change

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        if (!form.roomId || !form.guestName || !form.guestPhone || !form.checkInDate || !form.checkOutDate) {
            toast.error('Please fill all required fields');
            return;
        }
        if (new Date(form.checkOutDate) <= new Date(form.checkInDate)) {
            toast.error('Check-out date must be after check-in date');
            return;
        }
        try {
            setFormLoading(true);
            await api.post('/bookings', {
                ...form,
                numberOfGuests: parseInt(form.numberOfGuests),
                advancePayment: parseFloat(form.advancePayment) || 0,
            });
            toast.success('Room allotted successfully!');
            setShowCreateModal(false);
            fetchBookings();
            fetchStats();
            fetchAvailableRooms(); // keep room list in sync
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to allot room');
        } finally {
            setFormLoading(false);
        }
    };

    const handleCheckIn = async (booking) => {
        try {
            await api.put(`/bookings/${booking.id}/checkin`);
            toast.success(`Guest ${booking.guestName} checked in successfully`);
            fetchBookings();
            fetchStats();
            fetchAvailableRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check in guest');
        }
    };

    const handleCheckOut = async (booking) => {
        try {
            await api.put(`/bookings/${booking.id}/checkout`);
            toast.success(`Guest ${booking.guestName} checked out successfully`);
            fetchBookings();
            fetchStats();
            fetchAvailableRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check out guest');
        }
    };

    const openCancelModal = (booking) => {
        setSelectedBooking(booking);
        setCancellationReason('');
        setShowCancelModal(true);
    };

    const handleCancelBooking = async () => {
        if (!cancellationReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }
        try {
            await api.put(`/bookings/${selectedBooking.id}/cancel`, { cancellationReason });
            toast.success('Booking cancelled successfully');
            setShowCancelModal(false);
            fetchBookings();
            fetchStats();
            fetchAvailableRooms(); // room goes back to available
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFilteredBookings = () => {
        let filtered = bookings;
        if (activeTab !== 'all') {
            filtered = filtered.filter(b => b.bookingStatus === activeTab);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                b =>
                    b.guestName?.toLowerCase().includes(q) ||
                    b.bookingNumber?.toLowerCase().includes(q) ||
                    b.guestPhone?.includes(q) ||
                    b.room?.roomNumber?.toString().includes(q)
            );
        }
        return filtered;
    };

    const filteredBookings = getFilteredBookings();

    const tabCounts = {
        all: bookings.length,
        confirmed: bookings.filter(b => b.bookingStatus === 'confirmed').length,
        'checked-in': bookings.filter(b => b.bookingStatus === 'checked-in').length,
        'checked-out': bookings.filter(b => b.bookingStatus === 'checked-out').length,
        cancelled: bookings.filter(b => b.bookingStatus === 'cancelled').length,
    };

    const selectedRoomInfo = rooms.find(r => r.id === form.roomId);
    const balance = calculatedTotal - (parseFloat(form.advancePayment) || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <button
                        onClick={() => navigate('/rooms')}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-2 transition-colors"
                    >
                        <HomeModernIcon className="h-4 w-4" />
                        ← Back to Rooms
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarDaysIcon className="h-8 w-8 text-primary-600" />
                        Room Bookings
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage guest room allotments, check-ins and check-outs
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Allot Room
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                    {[
                        { label: 'Total', value: stats.totalBookings, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Confirmed', value: stats.confirmedBookings, color: 'text-blue-700', bg: 'bg-blue-50' },
                        { label: 'Checked In', value: stats.checkedInBookings, color: 'text-green-700', bg: 'bg-green-50' },
                        { label: 'Checked Out', value: stats.checkedOutBookings, color: 'text-gray-700', bg: 'bg-gray-50' },
                        { label: 'Cancelled', value: stats.cancelledBookings, color: 'text-red-700', bg: 'bg-red-50' },
                        { label: "Today's Check-ins", value: stats.todayCheckIns, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                        { label: "Today's Check-outs", value: stats.todayCheckOuts, color: 'text-orange-700', bg: 'bg-orange-50' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.bg} rounded-xl shadow-sm border border-gray-100 p-4`}>
                            <p className="text-xs font-medium text-gray-500 truncate">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Live Room Availability Strip */}
            {rooms.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                        <HomeModernIcon className="h-4 w-4" />
                        Available Rooms:
                    </span>
                    {rooms.map(r => (
                        <button
                            key={r.id}
                            onClick={() => openCreateModal(r.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-green-300 rounded-full text-xs font-medium text-green-800 hover:bg-green-100 transition-colors shadow-sm"
                        >
                            🛏 Room {r.roomNumber} · {r.roomType} · ₹{parseFloat(r.pricePerNight).toLocaleString('en-IN')}/night
                        </button>
                    ))}
                </div>
            )}
            {rooms.length === 0 && !loading && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>No rooms currently available. Go to <button onClick={() => navigate('/rooms')} className="underline font-semibold hover:text-amber-900">Rooms</button> to mark a room as available.</span>
                </div>
            )}

            {/* Tabs + Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Tabs */}
                <div className="border-b border-gray-200 px-4">
                    <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
                        {[
                            { key: 'all', label: 'All Bookings' },
                            { key: 'confirmed', label: 'Confirmed' },
                            { key: 'checked-in', label: 'Checked In' },
                            { key: 'checked-out', label: 'Checked Out' },
                            { key: 'cancelled', label: 'Cancelled' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {tabCounts[tab.key]}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Search */}
                <div className="p-4 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by guest, booking #, phone, room..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                    <span className="text-sm text-gray-500">
                        <FunnelIcon className="h-4 w-4 inline mr-1" />
                        {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Bookings Table */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
                        <p className="mt-3 text-sm text-gray-500">Loading bookings...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-16">
                        <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-3 text-sm font-medium text-gray-500">No bookings found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {searchQuery ? 'Try adjusting your search' : 'Click "Allot Room" to create the first booking'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Booking #', 'Guest', 'Room', 'Dates', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                                        <th
                                            key={h}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredBookings.map(booking => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Booking # */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-primary-700">
                                                {booking.bookingNumber}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {formatDate(booking.createdAt)}
                                            </p>
                                        </td>

                                        {/* Guest */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-primary-700">
                                                        {booking.guestName?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{booking.guestName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                                            <PhoneIcon className="h-3 w-3" />{booking.guestPhone}
                                                        </span>
                                                    </div>
                                                    {booking.guestEmail && (
                                                        <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                            <EnvelopeIcon className="h-3 w-3" />{booking.guestEmail}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Room */}
                                        <td className="px-4 py-3">
                                            {booking.room ? (
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        Room {booking.room.roomNumber}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {booking.room.roomType} · Floor {booking.room.floor}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>

                                        {/* Dates */}
                                        <td className="px-4 py-3">
                                            <div className="text-xs space-y-1">
                                                <div className="flex items-center gap-1 text-green-700 font-medium">
                                                    <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                                                    {formatDate(booking.checkInDate)}
                                                </div>
                                                <div className="flex items-center gap-1 text-red-600 font-medium">
                                                    <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5" />
                                                    {formatDate(booking.checkOutDate)}
                                                </div>
                                                <span className="text-gray-400">
                                                    {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''}
                                                    {' · '}{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-3">
                                            <div className="text-xs space-y-0.5">
                                                <p className="text-sm font-bold text-gray-900">
                                                    ₹{parseFloat(booking.totalAmount || 0).toLocaleString('en-IN')}
                                                </p>
                                                {parseFloat(booking.advancePayment) > 0 && (
                                                    <p className="text-gray-500">
                                                        Advance: ₹{parseFloat(booking.advancePayment).toLocaleString('en-IN')}
                                                    </p>
                                                )}
                                                {parseFloat(booking.balanceAmount) > 0 && (
                                                    <p className="text-red-600 font-medium">
                                                        Due: ₹{parseFloat(booking.balanceAmount).toLocaleString('en-IN')}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Payment */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${PAYMENT_COLORS[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                                                {booking.paymentStatus}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[booking.bookingStatus] || 'bg-gray-100 text-gray-700'}`}>
                                                {booking.bookingStatus === 'checked-in' ? '✓ Checked In' :
                                                    booking.bookingStatus === 'checked-out' ? '✓ Checked Out' :
                                                        booking.bookingStatus?.replace('-', ' ')}
                                            </span>
                                            {booking.actualCheckInTime && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    In: {formatDateTime(booking.actualCheckInTime)}
                                                </p>
                                            )}
                                            {booking.actualCheckOutTime && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Out: {formatDateTime(booking.actualCheckOutTime)}
                                                </p>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5">
                                                {booking.bookingStatus === 'confirmed' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleCheckIn(booking)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                                        >
                                                            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                                                            Check In
                                                        </button>
                                                        <button
                                                            onClick={() => openCancelModal(booking)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors"
                                                        >
                                                            <XCircleIcon className="h-3.5 w-3.5" />
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {booking.bookingStatus === 'checked-in' && (
                                                    <button
                                                        onClick={() => handleCheckOut(booking)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors"
                                                    >
                                                        <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5" />
                                                        Check Out
                                                    </button>
                                                )}
                                                {(booking.bookingStatus === 'checked-out' || booking.bookingStatus === 'cancelled') && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ───── CREATE BOOKING MODAL ───── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                        <HomeModernIcon className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Allot Room to Guest</h2>
                                        <p className="text-xs text-gray-500">Fill in guest details and select a room</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateBooking} className="p-6 space-y-5">
                                {/* Room Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Select Room <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="roomId"
                                        value={form.roomId}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    >
                                        <option value="">-- Select an available room --</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                Room {room.roomNumber} — {room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1)} | Floor {room.floor} | {room.capacity} Guests | ₹{parseFloat(room.pricePerNight).toLocaleString('en-IN')}/night | {room.bedType} bed
                                            </option>
                                        ))}
                                    </select>
                                    {rooms.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">No available rooms found. Change room status to 'Available' first.</p>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Check-in Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="checkInDate"
                                            value={form.checkInDate}
                                            onChange={handleFormChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Check-out Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="checkOutDate"
                                            value={form.checkOutDate}
                                            onChange={handleFormChange}
                                            min={form.checkInDate || new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Booking Summary Banner */}
                                {calculatedNights > 0 && selectedRoomInfo && (
                                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-primary-700">
                                                <ClockIcon className="h-5 w-5" />
                                                <span className="text-sm font-semibold">
                                                    {calculatedNights} night{calculatedNights !== 1 ? 's' : ''} × ₹{parseFloat(selectedRoomInfo.pricePerNight).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary-800">
                                                    ₹{calculatedTotal.toLocaleString('en-IN')}
                                                </p>
                                                <p className="text-xs text-primary-600">Total Amount</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Guest Details */}
                                <div className="border-t border-gray-100 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                        Guest Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Guest Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="guestName"
                                                value={form.guestName}
                                                onChange={handleFormChange}
                                                placeholder="Full name"
                                                required
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="guestPhone"
                                                value={form.guestPhone}
                                                onChange={handleFormChange}
                                                placeholder="+91 9876543210"
                                                required
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="guestEmail"
                                                value={form.guestEmail}
                                                onChange={handleFormChange}
                                                placeholder="guest@email.com"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">No. of Guests</label>
                                            <input
                                                type="number"
                                                name="numberOfGuests"
                                                value={form.numberOfGuests}
                                                onChange={handleFormChange}
                                                min="1"
                                                max={selectedRoomInfo?.capacity || 10}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Advance Payment (₹)
                                            </label>
                                            <div className="relative">
                                                <BanknotesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    name="advancePayment"
                                                    value={form.advancePayment}
                                                    onChange={handleFormChange}
                                                    placeholder="0"
                                                    min="0"
                                                    max={calculatedTotal || undefined}
                                                    className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                />
                                            </div>
                                            {calculatedTotal > 0 && parseFloat(form.advancePayment) > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Balance due: ₹{Math.max(0, balance).toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                            <input
                                                type="text"
                                                name="guestAddress"
                                                value={form.guestAddress}
                                                onChange={handleFormChange}
                                                placeholder="Guest's address"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Special Requests</label>
                                            <textarea
                                                name="specialRequests"
                                                value={form.specialRequests}
                                                onChange={handleFormChange}
                                                placeholder="Any special requests or notes..."
                                                rows={2}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading || rooms.length === 0}
                                        className="px-6 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Allotting...
                                            </>
                                        ) : (
                                            <>
                                                <HomeModernIcon className="h-4 w-4" />
                                                Confirm Allotment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ───── CANCEL BOOKING MODAL ───── */}
            {showCancelModal && selectedBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircleIcon className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Cancel Booking</h2>
                                    <p className="text-sm text-gray-500">{selectedBooking.bookingNumber} · {selectedBooking.guestName}</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                                Room {selectedBooking.room?.roomNumber} will be marked as available after cancellation.
                            </div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Reason for Cancellation <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={cancellationReason}
                                onChange={e => setCancellationReason(e.target.value)}
                                placeholder="Enter the reason for cancellation..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none resize-none"
                            />
                            <div className="flex justify-end gap-3 mt-5">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Keep Booking
                                </button>
                                <button
                                    onClick={handleCancelBooking}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Yes, Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookings;
