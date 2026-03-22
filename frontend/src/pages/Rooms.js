import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    HomeModernIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarDaysIcon,
    PlusCircleIcon,
    WrenchScrewdriverIcon,
    SparklesIcon,
    PencilIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const AMENITIES_OPTIONS = [
    'WiFi', 'AC', 'TV', 'Geyser', 'Mini Bar', 'Room Service',
    'Balcony View', 'Safe Locker', 'Hair Dryer', 'Sofa', 'Wardrobe',
    'Kettle', 'Bathtub', 'Shower', 'Iron & Board',
];

const initialEditState = {
    roomType: '',
    floor: '',
    capacity: '',
    pricePerNight: '',
    bedType: '',
    amenities: [],
    description: '',
    hasBalcony: false,
    hasWindow: true,
    smokingAllowed: false,
    notes: '',
};

const Rooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [activeBookings, setActiveBookings] = useState({});
    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [editForm, setEditForm] = useState(initialEditState);
    const [editLoading, setEditLoading] = useState(false);

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const { data } = await api.get('/rooms', { params });
            setRooms(data.data);
        } catch (error) {
            toast.error('Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/rooms/stats/overview');
            setStats(data.data);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    }, []);

    // Fetch active bookings so room cards can show current guest
    const fetchActiveBookings = useCallback(async () => {
        try {
            const { data } = await api.get('/bookings', {
                params: { status: 'checked-in' }
            });
            const confirmedData = await api.get('/bookings', {
                params: { status: 'confirmed' }
            });
            const combined = [
                ...(data.data || []),
                ...(confirmedData.data || [])
            ];
            const map = {};
            combined.forEach(b => {
                if (b.roomId) map[b.roomId] = b;
            });
            setActiveBookings(map);
        } catch (error) {
            // non-critical
        }
    }, []);

    useEffect(() => {
        fetchRooms();
        fetchStats();
        fetchActiveBookings();
    }, [fetchRooms, fetchStats, fetchActiveBookings]);

    const updateRoomStatus = async (roomId, newStatus) => {
        try {
            await api.put(`/rooms/${roomId}/status`, { status: newStatus });
            toast.success('Room status updated successfully');
            fetchRooms();
            fetchStats();
            fetchActiveBookings();
        } catch (error) {
            toast.error('Failed to update room status');
        }
    };

    const openEditModal = (room) => {
        setEditingRoom(room);
        setEditForm({
            roomType: room.roomType || '',
            floor: room.floor || '',
            capacity: room.capacity || '',
            pricePerNight: room.pricePerNight || '',
            bedType: room.bedType || '',
            amenities: room.amenities || [],
            description: room.description || '',
            hasBalcony: room.hasBalcony || false,
            hasWindow: room.hasWindow !== undefined ? room.hasWindow : true,
            smokingAllowed: room.smokingAllowed || false,
            notes: room.notes || '',
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const toggleAmenity = (amenity) => {
        setEditForm(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity],
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setEditLoading(true);
            await api.put(`/rooms/${editingRoom.id}`, {
                ...editForm,
                floor: parseInt(editForm.floor),
                capacity: parseInt(editForm.capacity),
                pricePerNight: parseFloat(editForm.pricePerNight),
            });
            toast.success(`Room ${editingRoom.roomNumber} updated successfully`);
            setShowEditModal(false);
            fetchRooms();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update room');
        } finally {
            setEditLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            available: 'bg-green-100 text-green-800',
            occupied: 'bg-red-100 text-red-800',
            maintenance: 'bg-orange-100 text-orange-800',
            cleaning: 'bg-blue-100 text-blue-800',
            reserved: 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getRoomTypeLabel = (type) => {
        const labels = {
            standard: 'Standard',
            deluxe: 'Deluxe',
            suite: 'Suite',
            family: 'Family',
            executive: 'Executive'
        };
        return labels[type] || type;
    };

    const getStatusIcon = (status) => {
        if (status === 'available') {
            return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
        }
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
    };

    if (loading) {
        return <div className="text-center py-12">Loading rooms...</div>;
    }

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <HomeModernIcon className="h-8 w-8 text-primary-600" />
                        Lodge Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage lodge rooms and their availability
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                    >
                        <CalendarDaysIcon className="h-5 w-5" />
                        Manage Bookings
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg col-span-2 sm:col-span-1">
                        <div className="p-5">
                            <div className="flex items-center">
                                <HomeModernIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 truncate">Total Rooms</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalRooms}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 truncate">Available</p>
                                    <p className="text-2xl font-semibold text-green-700">{stats.availableRooms}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-50 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <XCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />
                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 truncate">Occupied</p>
                                    <p className="text-2xl font-semibold text-red-700">{stats.occupiedRooms}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-orange-50 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <WrenchScrewdriverIcon className="h-6 w-6 text-orange-400 flex-shrink-0" />
                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 truncate">Maintenance</p>
                                    <p className="text-2xl font-semibold text-orange-700">{stats.maintenanceRooms}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <SparklesIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 truncate">Cleaning</p>
                                    <p className="text-2xl font-semibold text-blue-700">{stats.cleaningRooms}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-primary-50 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">📊</div>
                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 truncate">Occupancy</p>
                                    <p className="text-2xl font-semibold text-primary-700">{stats.occupancyRate}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="mb-6">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="all">All Rooms</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="cleaning">Cleaning</option>
                </select>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No rooms found
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div
                            key={room.id}
                            className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <span className="text-xl font-bold text-primary-600">
                                                {room.roomNumber}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Room {room.roomNumber}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Floor {room.floor}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(room)}
                                            title="Edit room details"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        {getStatusIcon(room.status)}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Type:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {getRoomTypeLabel(room.roomType)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Capacity:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {room.capacity} Guests
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Bed Type:</span>
                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                            {room.bedType}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Price/Night:</span>
                                        <span className="text-lg font-bold text-primary-600">
                                            ₹{parseFloat(room.pricePerNight).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                                            room.status
                                        )}`}
                                    >
                                        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                                    </span>
                                </div>

                                {room.amenities && room.amenities.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-2">Amenities:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {room.amenities.slice(0, 4).map((amenity, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                                >
                                                    {amenity}
                                                </span>
                                            ))}
                                            {room.amenities.length > 4 && (
                                                <span className="text-xs text-gray-500">
                                                    +{room.amenities.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Active Guest Info (occupied / reserved) */}
                                {(room.status === 'occupied' || room.status === 'reserved') && activeBookings[room.id] && (
                                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                                        <p className="font-semibold text-amber-800">
                                            👤 {activeBookings[room.id].guestName}
                                        </p>
                                        <p className="text-amber-600 mt-0.5">
                                            Check-out: {new Date(activeBookings[room.id].checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <button
                                            onClick={() => navigate('/bookings')}
                                            className="mt-1 text-amber-700 underline hover:text-amber-900 text-xs"
                                        >
                                            View Booking →
                                        </button>
                                    </div>
                                )}

                                {/* Status Update Buttons */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {room.status === 'available' && (
                                        <button
                                            onClick={() => navigate('/bookings', { state: { roomId: room.id, openModal: true } })}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                                        >
                                            <PlusCircleIcon className="h-4 w-4" />
                                            Allot Room
                                        </button>
                                    )}
                                    {room.status !== 'available' && (
                                        <button
                                            onClick={() => updateRoomStatus(room.id, 'available')}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Mark Available
                                        </button>
                                    )}
                                    {room.status !== 'cleaning' && room.status !== 'occupied' && (
                                        <button
                                            onClick={() => updateRoomStatus(room.id, 'cleaning')}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <SparklesIcon className="h-4 w-4" />
                                            Cleaning
                                        </button>
                                    )}
                                    {room.status !== 'maintenance' && room.status !== 'occupied' && (
                                        <button
                                            onClick={() => updateRoomStatus(room.id, 'maintenance')}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            <WrenchScrewdriverIcon className="h-4 w-4" />
                                            Maintenance
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ───── EDIT ROOM MODAL ───── */}
            {showEditModal && editingRoom && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary-600">{editingRoom.roomNumber}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Edit Room {editingRoom.roomNumber}</h2>
                                        <p className="text-xs text-gray-500">Update room details and configuration</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                                {/* Row 1 — Type, Floor, Capacity */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Room Type</label>
                                        <select name="roomType" value={editForm.roomType} onChange={handleEditChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                                            <option value="standard">Standard</option>
                                            <option value="deluxe">Deluxe</option>
                                            <option value="suite">Suite</option>
                                            <option value="family">Family</option>
                                            <option value="executive">Executive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Floor</label>
                                        <input type="number" name="floor" value={editForm.floor} onChange={handleEditChange}
                                            min="1" max="10" required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Capacity (guests)</label>
                                        <input type="number" name="capacity" value={editForm.capacity} onChange={handleEditChange}
                                            min="1" max="6" required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                                    </div>
                                </div>

                                {/* Row 2 — Price, Bed Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price per Night (₹)</label>
                                        <input type="number" name="pricePerNight" value={editForm.pricePerNight} onChange={handleEditChange}
                                            min="0" step="0.01" required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bed Type</label>
                                        <select name="bedType" value={editForm.bedType} onChange={handleEditChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                                            <option value="single">Single</option>
                                            <option value="double">Double</option>
                                            <option value="queen">Queen</option>
                                            <option value="king">King</option>
                                            <option value="twin">Twin</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Amenities</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AMENITIES_OPTIONS.map(amenity => (
                                            <button
                                                key={amenity}
                                                type="button"
                                                onClick={() => toggleAmenity(amenity)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${editForm.amenities.includes(amenity)
                                                        ? 'bg-primary-600 text-white border-primary-600'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                                                    }`}
                                            >
                                                {editForm.amenities.includes(amenity) ? '✓ ' : ''}{amenity}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { name: 'hasBalcony', label: '🌿 Has Balcony' },
                                        { name: 'hasWindow', label: '🪟 Has Window' },
                                        { name: 'smokingAllowed', label: '🚬 Smoking Allowed' },
                                    ].map(toggle => (
                                        <label key={toggle.name} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                name={toggle.name}
                                                checked={editForm[toggle.name]}
                                                onChange={handleEditChange}
                                                className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-xs font-medium text-gray-700">{toggle.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                                    <textarea name="description" value={editForm.description} onChange={handleEditChange}
                                        rows={2} placeholder="Brief description of the room..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
                                </div>

                                {/* Internal Notes */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Internal Notes (staff only)</label>
                                    <textarea name="notes" value={editForm.notes} onChange={handleEditChange}
                                        rows={2} placeholder="Any internal notes for housekeeping or maintenance..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editLoading}
                                        className="px-6 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center gap-2">
                                        {editLoading ? (
                                            <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                                        ) : (
                                            <><PencilIcon className="h-4 w-4" />Save Changes</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
