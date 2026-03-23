import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchRecentOrders();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/reports/dashboard');
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data } = await api.get('/orders?limit=5');
      setRecentOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffInSeconds = Math.floor((now - orderDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getActivityColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-purple-500',
      ready: 'bg-green-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getActivityIcon = (type) => {
    return type === 'dine-in' ? 'D' : type === 'takeaway' ? 'T' : type === 'delivery' ? 'DL' : 'O';
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const safePercentChange = (currentValue, previousValue) => {
    const current = Number(currentValue || 0);
    const previous = Number(previousValue || 0);

    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
      return 0;
    }

    const change = ((current - previous) / previous) * 100;
    return Number.isFinite(change) ? change.toFixed(1) : 0;
  };

  const statsCards = [
    {
      name: "Today's Orders",
      value: stats?.today?.orders || 0,
      change: safePercentChange(stats?.today?.orders, stats?.yesterday?.orders),
      color: 'bg-blue-500',
      link: '/orders'
    },
    {
      name: "Today's Revenue",
      value: `₹${stats?.today?.revenue || 0}`,
      change: safePercentChange(stats?.today?.revenue, stats?.yesterday?.revenue),
      color: 'bg-green-500',
      link: '/reports'
    },
    {
      name: 'Active Orders',
      value: stats?.activeOrders || 0,
      color: 'bg-yellow-500',
      link: '/orders'
    },
    {
      name: 'Low Stock Alerts',
      value: stats?.lowStockAlerts || 0,
      color: 'bg-red-500',
      link: '/inventory'
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsCards.map((stat) => (
          <div 
            key={stat.name} 
            onClick={() => navigate(stat.link)}
            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <div className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          parseFloat(stat.change) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change > 0 ? '+' : ''}{stat.change}%
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button 
            onClick={() => navigate('/pos')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            New Order
          </button>
          <button 
            onClick={() => navigate('/reservations')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add Reservation
          </button>
          <button 
            onClick={() => navigate('/customers')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            New Customer
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            View Reports
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <button 
            onClick={() => navigate('/orders')}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            View all
          </button>
        </div>
        <div className="flow-root">
          {recentOrders.length > 0 ? (
            <ul className="-mb-8">
              {recentOrders.map((order, index) => (
                <li key={order.id} className="relative pb-8">
                  {index < recentOrders.length - 1 && (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  )}
                  <div className="relative flex space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`h-8 w-8 rounded-full ${getActivityColor(order.status)} flex items-center justify-center ring-8 ring-white`}>
                        <span className="text-white text-xs font-semibold">
                          {getActivityIcon(order.orderType)}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-500">
                            {order.orderType === 'dine-in' && 'Dine-in order'}
                            {order.orderType === 'takeaway' && 'Takeaway order'}
                            {order.orderType === 'delivery' && 'Delivery order'}
                            {order.orderType === 'online' && 'Online order'}
                            {' '}
                            <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                            order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4">
                          <p className="text-xs text-gray-400">{formatTimeAgo(order.createdAt)}</p>
                          <p className="text-xs font-medium text-gray-900">₹{parseFloat(order.total).toFixed(2)}</p>
                          {order.customerName && (
                            <p className="text-xs text-gray-500">{order.customerName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
