import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PrinterIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-toastify';
import BillPreviewModal from '../components/BillPreviewModal';

const Orders = () => {
  const { user } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [billPreviewOrder, setBillPreviewOrder] = useState(null);

  // Set initial section filter based on user's role and section
  const getInitialSectionFilter = () => {
    if (user?.role === 'captain' && user?.section) {
      return user.section;
    }
    return 'all';
  };

  const [sectionFilter, setSectionFilter] = useState(getInitialSectionFilter());

  // Update section filter when user changes
  useEffect(() => {
    if (user?.role === 'captain' && user?.section) {
      setSectionFilter(user.section);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (sectionFilter !== 'all') params.section = sectionFilter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sectionFilter]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  return (
    <div>
      <BillPreviewModal
        isOpen={!!billPreviewOrder}
        order={billPreviewOrder}
        onClose={() => setBillPreviewOrder(null)}
      />
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={user?.role === 'captain'}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Sections</option>
            <option value="lodge-dine">🏨 Lodge-Dine</option>
            <option value="cafe-restaurant">☕ Cafe-Restaurant</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500">
              No orders found
            </li>
          ) : (
            orders.map((order) => (
              <li key={order.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary-600">
                        {order.orderNumber}
                      </p>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:space-x-4">
                        <p className="flex items-center text-sm text-gray-500">
                          {order.orderType}
                        </p>
                        {order.section && (
                          <p className="mt-2 flex items-center text-sm sm:mt-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.section === 'lodge-dine'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {order.section === 'lodge-dine' ? '🏨 Lodge-Dine' : '☕ Cafe-Restaurant'}
                            </span>
                          </p>
                        )}
                        {order.tableNumber && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="font-medium text-gray-700">Table:</span>&nbsp;{order.tableNumber}
                          </p>
                        )}
                        {order.customerName && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="font-medium text-gray-700">Customer:</span>&nbsp;{order.customerName}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="font-semibold text-gray-900">
                          ₹{parseFloat(order.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Timeline Information */}
                    {order.timeline && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                          {/* Display timestamps */}
                          {order.timeline.timestamps?.pending && (
                            <div>
                              <span className="font-semibold text-gray-700">Ordered:</span>{' '}
                              {new Date(order.timeline.timestamps.pending).toLocaleString()}
                            </div>
                          )}
                          {order.timeline.timestamps?.confirmed && (
                            <div>
                              <span className="font-semibold text-gray-700">Confirmed:</span>{' '}
                              {new Date(order.timeline.timestamps.confirmed).toLocaleTimeString()}
                            </div>
                          )}
                          {order.timeline.timestamps?.preparing && (
                            <div>
                              <span className="font-semibold text-gray-700">Preparing:</span>{' '}
                              {new Date(order.timeline.timestamps.preparing).toLocaleTimeString()}
                            </div>
                          )}
                          {order.timeline.timestamps?.ready && (
                            <div>
                              <span className="font-semibold text-gray-700">Ready:</span>{' '}
                              {new Date(order.timeline.timestamps.ready).toLocaleTimeString()}
                            </div>
                          )}
                          {order.timeline.timestamps?.served && (
                            <div>
                              <span className="font-semibold text-gray-700">Served:</span>{' '}
                              {new Date(order.timeline.timestamps.served).toLocaleTimeString()}
                            </div>
                          )}
                          {order.timeline.timestamps?.completed && (
                            <div>
                              <span className="font-semibold text-gray-700">Completed:</span>{' '}
                              {new Date(order.timeline.timestamps.completed).toLocaleTimeString()}
                            </div>
                          )}

                          {/* Display durations */}
                          {order.timeline.durations && Object.keys(order.timeline.durations).length > 0 && (
                            <div className="w-full mt-2 pt-2 border-t border-gray-100">
                              <span className="font-semibold text-gray-700">Durations: </span>
                              {order.timeline.durations.pendingTime !== undefined && (
                                <span className="mr-4">⏱️ Pending: {order.timeline.durations.pendingTime}m</span>
                              )}
                              {order.timeline.durations.confirmationTime !== undefined && (
                                <span className="mr-4">📋 Confirming: {order.timeline.durations.confirmationTime}m</span>
                              )}
                              {order.timeline.durations.preparationTime !== undefined && (
                                <span className="mr-4">👨‍🍳 Preparing: {order.timeline.durations.preparationTime}m</span>
                              )}
                              {order.timeline.durations.waitingTime !== undefined && (
                                <span className="mr-4">⏰ Waiting: {order.timeline.durations.waitingTime}m</span>
                              )}
                              {order.timeline.durations.serviceTime !== undefined && (
                                <span className="mr-4">✅ Service: {order.timeline.durations.serviceTime}m</span>
                              )}
                              {order.timeline.totalTime !== null && (
                                <span className="font-bold text-primary-600">🕐 Total: {order.timeline.totalTime}m</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex flex-wrap justify-end gap-2">
                    {order.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => setBillPreviewOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 bg-white text-gray-800 text-sm rounded hover:bg-gray-50"
                        title="Print bill"
                      >
                        <PrinterIcon className="h-4 w-4" aria-hidden />
                        Print bill
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Confirm
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        Prepare
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default Orders;
