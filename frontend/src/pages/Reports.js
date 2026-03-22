import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ClockIcon, UserIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [depletionReport, setDepletionReport] = useState(null);
  const [depletionLoading, setDepletionLoading] = useState(false);
  const [depletionFilters, setDepletionFilters] = useState({ startDate: '', endDate: '' });
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState(null);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    entityType: '',
    search: ''
  });

  useEffect(() => {
    fetchReportData();
  }, [activeTab, auditPage, auditFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'sales') {
        const { data } = await api.get('/reports/sales', {
          params: { groupBy: 'day' }
        });
        setSalesData(data.data);
      } else if (activeTab === 'menu') {
        const { data } = await api.get('/reports/menu');
        setMenuData(data.data);
      } else if (activeTab === 'inventory') {
        const { data } = await api.get('/reports/inventory');
        setInventoryData(data.data);
        setDepletionReport(null);
      } else if (activeTab === 'history') {
        // Fetch audit logs
        const { data } = await api.get('/audit', {
          params: {
            page: auditPage,
            limit: 20,
            ...auditFilters
          }
        });
        setAuditLogs(data.data.logs);
        setAuditPagination(data.data.pagination);

        // Fetch audit stats
        const statsResponse = await api.get('/audit/stats');
        setAuditStats(statsResponse.data.data);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch report data');
      setLoading(false);
    }
  };

  const fetchDepletionReport = async () => {
    try {
      setDepletionLoading(true);
      const params = {};
      if (depletionFilters.startDate) params.startDate = depletionFilters.startDate;
      if (depletionFilters.endDate) params.endDate = depletionFilters.endDate;
      const { data } = await api.get('/reports/inventory-depletion', { params });
      setDepletionReport(data.data);
      setDepletionLoading(false);
    } catch (error) {
      toast.error('Failed to fetch depletion report');
      setDepletionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading reports...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['sales', 'menu', 'inventory', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab === 'history' ? 'Audit History' : `${tab} Report`}
            </button>
          ))}
        </nav>
      </div>

      {/* Sales Report */}
      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{salesData.summary.totalRevenue}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {salesData.summary.totalOrders}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{salesData.summary.avgOrderValue}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Revenue by Order Type</h3>
              <div className="space-y-2">
                {salesData.revenueByType?.map((item) => (
                  <div key={item.orderType} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{item.orderType}</span>
                    <span className="text-sm font-semibold">₹{parseFloat(item.revenue).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Revenue by Payment Method</h3>
              <div className="space-y-2">
                {salesData.revenueByPayment?.map((item) => (
                  <div key={item.paymentMethod} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{item.paymentMethod}</span>
                    <span className="text-sm font-semibold">₹{parseFloat(item.revenue).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Report */}
      {activeTab === 'menu' && menuData && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menuData.topSellingItems?.map((item) => (
                  <tr key={item.menuItemId}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{parseFloat(item.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeTab === 'inventory' && inventoryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {inventoryData.summary.totalItems}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{inventoryData.summary.totalValue}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {inventoryData.summary.lowStockCount}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {inventoryData.summary.outOfStockCount}
              </p>
            </div>
          </div>

          {/* Inventory Depletion Report */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Inventory Depletion Report</h3>
            <p className="text-sm text-gray-500 mb-4">
              View depletion history with date and time for all inventory items.
            </p>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={depletionFilters.startDate}
                  onChange={(e) => setDepletionFilters({ ...depletionFilters, startDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={depletionFilters.endDate}
                  onChange={(e) => setDepletionFilters({ ...depletionFilters, endDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={fetchDepletionReport}
                disabled={depletionLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {depletionLoading ? 'Loading...' : 'Generate Depletion Report'}
              </button>
            </div>
            {depletionReport && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depletion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {depletionReport.depletions?.length > 0 ? (
                      depletionReport.depletions.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(d.dateTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>{d.itemName}</div>
                            {d.itemSku && <div className="text-xs text-gray-500">{d.itemSku}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.category || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                            -{parseFloat(d.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(d.previousStock).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(d.newStock).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.unit || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No depletion records found for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {inventoryData.lowStockItems?.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">Low Stock Alerts</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryData.lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-orange-600 font-semibold">
                        {parseFloat(item.currentStock).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {parseFloat(item.minStock).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          {auditStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Actions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {auditStats.totalActions}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <UserIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {auditStats.uniqueUsers}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Today's Actions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {auditStats.actionsToday}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                <select
                  value={auditFilters.action || ''}
                  onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                <select
                  value={auditFilters.entityType || ''}
                  onChange={(e) => setAuditFilters({ ...auditFilters, entityType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Entities</option>
                  <option value="Menu">Menu</option>
                  <option value="Order">Order</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Reservation">Reservation</option>
                  <option value="Customer">Customer</option>
                  <option value="Staff">Staff</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={auditFilters.search || ''}
                  onChange={(e) => setAuditFilters({ ...auditFilters, search: e.target.value || undefined })}
                  placeholder="Search description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={auditFilters.startDate || ''}
                  onChange={(e) => setAuditFilters({ ...auditFilters, startDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' : ''}
                          ${log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : ''}
                          ${log.action === 'DELETE' ? 'bg-red-100 text-red-800' : ''}
                          ${log.action === 'LOGIN' ? 'bg-purple-100 text-purple-800' : ''}
                          ${log.action === 'LOGOUT' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.entityType || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        `}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditPagination && auditPagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-lg shadow flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(auditPagination.currentPage - 1) * auditPagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(auditPagination.currentPage * auditPagination.limit, auditPagination.totalItems)}
                </span>{' '}
                of <span className="font-medium">{auditPagination.totalItems}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAuditPage(auditPage - 1)}
                  disabled={auditPage === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setAuditPage(auditPage + 1)}
                  disabled={auditPage === auditPagination.totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
