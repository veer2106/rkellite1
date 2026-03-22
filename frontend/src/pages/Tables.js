import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const Tables = () => {
    const { user } = useSelector(state => state.auth);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddTableModal, setShowAddTableModal] = useState(false);
    const [showEditTableModal, setShowEditTableModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [editTableData, setEditTableData] = useState({
        tableNumber: '',
        section: '',
        seats: 4,
        location: 'Main Hall'
    });
    const [newTableData, setNewTableData] = useState({
        tableNumber: '',
        section: '',
        seats: 4,
        location: 'Main Hall'
    });

    // Set initial section based on user's role and section
    const getInitialSection = () => {
        if (user?.role === 'captain' && user?.section) {
            return user.section;
        }
        return 'lodge-dine';
    };

    const [selectedSection, setSelectedSection] = useState(getInitialSection());
    const [tableConfig, setTableConfig] = useState({
        'lodge-dine': 0,
        'cafe-restaurant': 0
    });
    const [setupMode, setSetupMode] = useState(false);
    const [setupData, setSetupData] = useState({
        section: getInitialSection(),
        numberOfTables: 10,
        seatsPerTable: 4
    });

    useEffect(() => {
        fetchTables();
        fetchTableConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSection]);

    // Update section when user changes
    useEffect(() => {
        if (user?.role === 'captain' && user?.section) {
            setSelectedSection(user.section);
            setSetupData(prev => ({ ...prev, section: user.section }));
            setNewTableData(prev => ({ ...prev, section: user.section }));
        } else {
            setNewTableData(prev => ({ ...prev, section: selectedSection }));
        }
    }, [user, selectedSection]);

    const fetchTables = async () => {
        try {
            const { data } = await api.get(`/tables?section=${selectedSection}`);
            setTables(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch tables');
            setLoading(false);
        }
    };

    const fetchTableConfig = async () => {
        try {
            const { data } = await api.get('/tables/config');
            setTableConfig(data.data);
        } catch (error) {
            console.error('Failed to fetch table config');
        }
    };

    const handleSetupTables = async () => {
        try {
            await api.post('/tables/setup', setupData);
            toast.success(`Successfully set up ${setupData.numberOfTables} tables for ${setupData.section}`);
            setSetupMode(false);
            fetchTables();
            fetchTableConfig();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to setup tables');
        }
    };

    const handleUpdateTableStatus = async (tableId, newStatus) => {
        try {
            await api.put(`/tables/${tableId}/status`, { status: newStatus });
            toast.success('Table status updated');
            fetchTables();
        } catch (error) {
            toast.error('Failed to update table status');
        }
    };

    const handleAddTable = async () => {
        try {
            if (!newTableData.tableNumber || !newTableData.section) {
                toast.error('Please provide table number and section');
                return;
            }

            await api.post('/tables', newTableData);
            toast.success(`Table ${newTableData.tableNumber} added successfully to ${newTableData.section}`);
            setShowAddTableModal(false);
            setNewTableData({
                tableNumber: '',
                section: selectedSection,
                seats: 4,
                location: 'Main Hall'
            });
            fetchTables();
            fetchTableConfig();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add table');
        }
    };

    const handleEditTable = (table) => {
        setEditingTable(table);
        setEditTableData({
            tableNumber: table.tableNumber,
            section: table.section,
            seats: table.seats,
            location: table.location || 'Main Hall'
        });
        setShowEditTableModal(true);
    };

    const handleUpdateTable = async (e) => {
        e.preventDefault();
        if (!editingTable) return;
        try {
            await api.put(`/tables/${editingTable.id}`, editTableData);
            toast.success('Table updated successfully');
            setShowEditTableModal(false);
            setEditingTable(null);
            fetchTables();
            fetchTableConfig();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update table');
        }
    };

    const handleDeleteTable = async (table) => {
        if (!window.confirm(`Delete table #${table.tableNumber}? This cannot be undone.`)) return;
        try {
            await api.delete(`/tables/${table.id}`);
            toast.success('Table deleted successfully');
            fetchTables();
            fetchTableConfig();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete table');
        }
    };

    const canManageTables = user?.role === 'admin' || user?.role === 'manager';

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'occupied':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'reserved':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'cleaning':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available':
                return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
            case 'occupied':
                return <XCircleIcon className="h-5 w-5 text-red-600" />;
            case 'reserved':
            case 'cleaning':
                return <ClockIcon className="h-5 w-5 text-yellow-600" />;
            default:
                return null;
        }
    };

    const availableTables = tables.filter(t => t.status === 'available' && t.isActive).length;
    const occupiedTables = tables.filter(t => t.status === 'occupied' && t.isActive).length;
    const activeTables = tables.filter(t => t.isActive).length;

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Table Management</h1>
                <p className="text-gray-600">Manage tables for Lodge-Dine and Cafe-Restaurant sections</p>
            </div>

            {/* Section Toggle */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => user?.role !== 'captain' && setSelectedSection('lodge-dine')}
                        disabled={user?.role === 'captain' && user?.section !== 'lodge-dine'}
                        className={`px-4 py-2 rounded-md font-semibold transition-all ${selectedSection === 'lodge-dine'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            } ${user?.role === 'captain' && user?.section !== 'lodge-dine' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        🏨 Lodge-Dine ({tableConfig['lodge-dine']} tables)
                    </button>
                    <button
                        onClick={() => user?.role !== 'captain' && setSelectedSection('cafe-restaurant')}
                        disabled={user?.role === 'captain' && user?.section !== 'cafe-restaurant'}
                        className={`px-4 py-2 rounded-md font-semibold transition-all ${selectedSection === 'cafe-restaurant'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            } ${user?.role === 'captain' && user?.section !== 'cafe-restaurant' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        ☕ Cafe-Restaurant ({tableConfig['cafe-restaurant']} tables)
                    </button>
                </div>

                {/* Only admin and manager can setup tables */}
                {user?.role !== 'captain' && (
                    <>
                        <button
                            onClick={() => setShowAddTableModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            + Add Table
                        </button>
                        <button
                            onClick={() => {
                                setSetupMode(!setupMode);
                                setSetupData({ ...setupData, section: selectedSection });
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {setupMode ? 'Cancel Setup' : 'Bulk Setup'}
                        </button>
                    </>
                )}
            </div>

            {/* Setup Mode */}
            {setupMode && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Setup Tables for {setupData.section}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Section
                            </label>
                            <select
                                value={setupData.section}
                                onChange={(e) => setSetupData({ ...setupData, section: e.target.value })}
                                disabled={user?.role === 'captain'}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="lodge-dine">Lodge-Dine</option>
                                <option value="cafe-restaurant">Cafe-Restaurant</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Tables
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={setupData.numberOfTables}
                                onChange={(e) => setSetupData({ ...setupData, numberOfTables: parseInt(e.target.value) })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seats Per Table
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={setupData.seatsPerTable}
                                onChange={(e) => setSetupData({ ...setupData, seatsPerTable: parseInt(e.target.value) })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSetupTables}
                        className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Create/Update Tables
                    </button>

                    <p className="mt-4 text-sm text-gray-600">
                        💡 This will create {setupData.numberOfTables} tables numbered 1 to {setupData.numberOfTables}.
                        Existing tables will be updated. Tables beyond this count will be deactivated.
                    </p>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Tables</p>
                            <p className="text-3xl font-bold text-gray-900">{activeTables}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Available</p>
                            <p className="text-3xl font-bold text-green-600">{availableTables}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Occupied</p>
                            <p className="text-3xl font-bold text-red-600">{occupiedTables}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <XCircleIcon className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Grid */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedSection === 'lodge-dine' ? '🏨 Lodge-Dine Tables' : '☕ Cafe-Restaurant Tables'}
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No tables configured for this section</p>
                            <button
                                onClick={() => setSetupMode(true)}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Setup Tables Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {tables
                                .filter(table => table.isActive)
                                .sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber))
                                .map((table) => (
                                    <div
                                        key={table.id}
                                        className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(table.status)} ${table.status === 'available' ? 'hover:shadow-lg cursor-pointer' : ''
                                            }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="mb-2">
                                                {getStatusIcon(table.status)}
                                            </div>
                                            <div className="text-2xl font-bold mb-1">#{table.tableNumber}</div>
                                            <div className="text-sm mb-2">
                                                {table.seats} seats
                                            </div>
                                            <div className="text-xs font-medium uppercase mb-3">
                                                {table.status}
                                            </div>

                                            {table.currentOrder && (
                                                <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded mb-2">
                                                    Order: {table.currentOrder.orderNumber}
                                                </div>
                                            )}

                                            {table.status === 'occupied' && (
                                                <button
                                                    onClick={() => handleUpdateTableStatus(table.id, 'available')}
                                                    className="text-xs px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-50 border border-gray-300"
                                                >
                                                    Mark Available
                                                </button>
                                            )}

                                            {table.status === 'cleaning' && (
                                                <button
                                                    onClick={() => handleUpdateTableStatus(table.id, 'available')}
                                                    className="text-xs px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-50 border border-gray-300"
                                                >
                                                    Done Cleaning
                                                </button>
                                            )}

                                            {canManageTables && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditTable(table); }}
                                                        className="p-1.5 rounded bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-primary-600"
                                                        title="Edit table"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTable(table); }}
                                                        className="p-1.5 rounded bg-white/80 hover:bg-red-50 border border-gray-300 text-gray-600 hover:text-red-600"
                                                        title="Delete table"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Status Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">Available - Ready for customers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">Occupied - Has active order</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Reserved - Reserved for customer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm">Cleaning - Being cleaned</span>
                    </div>
                </div>
            </div>

            {/* Add Table Modal */}
            {showAddTableModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Add New Table</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Table Number *
                                </label>
                                <input
                                    type="text"
                                    value={newTableData.tableNumber}
                                    onChange={(e) => setNewTableData({ ...newTableData, tableNumber: e.target.value })}
                                    placeholder="e.g., LD-11 or CR-11"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Recommended format: LD-## for Lodge-Dine, CR-## for Cafe-Restaurant
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Section *
                                </label>
                                <select
                                    value={newTableData.section}
                                    onChange={(e) => setNewTableData({ ...newTableData, section: e.target.value })}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="lodge-dine">🏨 Lodge-Dine</option>
                                    <option value="cafe-restaurant">☕ Cafe-Restaurant</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Seats
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={newTableData.seats}
                                    onChange={(e) => setNewTableData({ ...newTableData, seats: parseInt(e.target.value) })}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={newTableData.location}
                                    onChange={(e) => setNewTableData({ ...newTableData, location: e.target.value })}
                                    placeholder="e.g., Main Hall, Patio, Window Side"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleAddTable}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Add Table
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddTableModal(false);
                                    setNewTableData({
                                        tableNumber: '',
                                        section: selectedSection,
                                        seats: 4,
                                        location: 'Main Hall'
                                    });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {showEditTableModal && editingTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Edit Table</h2>

                        <form onSubmit={handleUpdateTable} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Table Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editTableData.tableNumber}
                                    onChange={(e) => setEditTableData({ ...editTableData, tableNumber: e.target.value })}
                                    placeholder="e.g., LD-11 or CR-11"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Section *
                                </label>
                                <select
                                    value={editTableData.section}
                                    onChange={(e) => setEditTableData({ ...editTableData, section: e.target.value })}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="lodge-dine">🏨 Lodge-Dine</option>
                                    <option value="cafe-restaurant">☕ Cafe-Restaurant</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Seats
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={editTableData.seats}
                                    onChange={(e) => setEditTableData({ ...editTableData, seats: parseInt(e.target.value) || 4 })}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editTableData.location}
                                    onChange={(e) => setEditTableData({ ...editTableData, location: e.target.value })}
                                    placeholder="e.g., Main Hall, Patio"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Update Table
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditTableModal(false);
                                        setEditingTable(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tables;
