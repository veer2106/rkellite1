import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, MinusIcon, TrashIcon, MagnifyingGlassIcon, TableCellsIcon } from '@heroicons/react/24/outline';

const POS = () => {
  const { user } = useSelector(state => state.auth);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Set initial section based on user's role and section
  const getInitialSection = () => {
    if (user?.role === 'captain' && user?.section) {
      return user.section;
    }
    return 'lodge-dine';
  };

  const [selectedSection, setSelectedSection] = useState(getInitialSection());
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [allTables, setAllTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null); // When adding to occupied table
  const [loadingTableOrder, setLoadingTableOrder] = useState(false); // Loading order for occupied table

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchAllTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update section when user changes
  useEffect(() => {
    if (user?.role === 'captain' && user?.section) {
      setSelectedSection(user.section);
    }
  }, [user]);

  // Fetch all tables when section changes
  useEffect(() => {
    fetchAllTables();
    setSelectedTableId(null);
    setTableNumber('');
    setCurrentOrderId(null);
    setLoadingTableOrder(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

  // Reset table selection when order type changes
  useEffect(() => {
    if (orderType !== 'dine-in') {
      setSelectedTableId(null);
      setTableNumber('');
      setCurrentOrderId(null);
      setLoadingTableOrder(false);
    }
  }, [orderType]);

  const fetchMenuItems = async () => {
    try {
      const { data } = await api.get('/menu');
      setMenuItems(data.data.filter(item => item.isAvailable));
    } catch (error) {
      toast.error('Failed to fetch menu items');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/menu/categories');
      const names = (data.data || []).map(c => (typeof c === 'object' && c.name) ? c.name : c);
      setCategories(['all', ...names]);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchAllTables = async () => {
    try {
      const { data } = await api.get(`/tables?section=${selectedSection}&isActive=true`);
      setAllTables(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tables');
      setAllTables([]);
    }
  };

  const handleTableSelect = async (table) => {
    // Allow selecting both available and occupied tables (occupied = add more items)
    if (!['available', 'occupied'].includes(table.status)) return;
    if (selectedTableId !== table.id) {
      setCart([]); // Clear cart when switching tables
    }
    setSelectedTableId(table.id);
    setTableNumber(table.tableNumber);

    // For occupied tables: always fetch current order to get order ID reliably
    if (table.status === 'occupied') {
      setLoadingTableOrder(true);
      setCurrentOrderId(null);
      try {
        // Use tableId when available (most reliable), fallback to section+tableNumber
        const params = table.id
          ? `tableId=${encodeURIComponent(table.id)}`
          : `section=${encodeURIComponent(selectedSection)}&tableNumber=${encodeURIComponent(table.tableNumber)}`;
        const { data } = await api.get(`/orders/by-table?${params}`);
        const orderId = data.data?.orderId || data.data?.order?.id;
        // Ensure we have a valid UUID (never use display labels or wrong values)
        const isValidUuid = orderId && typeof orderId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        setCurrentOrderId(isValidUuid ? orderId : null);
        if (!isValidUuid) {
          toast.error('Could not load order for this table');
        }
      } catch (err) {
        console.error('Failed to fetch current order for table:', err);
        toast.error(err.response?.data?.message || 'Could not load order for this table');
        setCurrentOrderId(null);
      } finally {
        setLoadingTableOrder(false);
      }
    } else {
      setCurrentOrderId(null);
      setLoadingTableOrder(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.menuItemId === item.id);
    if (existingItem) {
      setCart(cart.map(i =>
        i.menuItemId === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart(cart.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Validate table number for dine-in orders
    if (orderType === 'dine-in' && !tableNumber) {
      toast.error('Please select a table');
      return;
    }

    try {
      if (currentOrderId) {
        // Adding items to existing order (occupied table)
        await api.post(`/orders/${currentOrderId}/add-items`, {
          items: cart.map(({ menuItemId, name, price, quantity }) => ({
            menuItemId,
            name,
            price,
            quantity
          }))
        });
        toast.success(`Added items to Table ${tableNumber}'s order`);
      } else {
        // New order - check table availability for dine-in
        if (orderType === 'dine-in' && tableNumber) {
          const { data } = await api.get(`/tables/availability/${selectedSection}/${tableNumber}`);
          if (!data.available) {
            toast.error(data.message || `Table ${tableNumber} is not available`);
            return;
          }
        }

        const orderData = {
          orderType,
          section: selectedSection,
          tableNumber: orderType === 'dine-in' ? tableNumber : null,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          items: cart,
          paymentMethod: 'cash'
        };

        await api.post('/orders', orderData);
        toast.success(`Order created successfully!${orderType === 'dine-in' ? ` Table ${tableNumber} is now occupied.` : ''}`);
      }

      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      if (!currentOrderId) {
        setTableNumber('');
        setSelectedTableId(null);
      }
      // Keep table selected when adding to existing order so user can add more items
      fetchAllTables(); // Refresh table status
    } catch (error) {
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || (currentOrderId ? 'Failed to add items to order' : 'Failed to create order');
      toast.error(errorMessage);
    }
  };

  const { subtotal, tax, total } = calculateTotal();

  // Filter items by section first, then by category, then by search
  const sectionFilteredItems = menuItems.filter(item => {
    // Show items that are assigned to this section or to 'both'
    return item.section === selectedSection || item.section === 'both';
  });

  const categoryFilteredItems = selectedCategory === 'all'
    ? sectionFilteredItems
    : sectionFilteredItems.filter(item => item.category === selectedCategory);

  const filteredItems = searchQuery.trim()
    ? categoryFilteredItems.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = item.name?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const categoryMatch = item.category?.toLowerCase().includes(query);
        return nameMatch || descMatch || categoryMatch;
      })
    : categoryFilteredItems;

  // Can add items: table selected (dine-in) or takeaway/delivery
  // For occupied tables, wait until we have currentOrderId; for available tables, selectedTableId is enough
  const selectedTable = allTables.find(t => t.id === selectedTableId);
  const isOccupiedTable = selectedTable?.status === 'occupied';
  const canAddItems = orderType !== 'dine-in'
    ? true
    : selectedTableId && (!isOccupiedTable || currentOrderId) && !loadingTableOrder;
  const getTableStatusStyle = (status) => {
    switch (status) {
      case 'available': return 'bg-green-50 border-green-400 hover:bg-green-100 hover:border-green-500 hover:shadow-md cursor-pointer';
      case 'occupied': return 'bg-amber-50 border-amber-400 hover:bg-amber-100 hover:border-amber-500 hover:shadow-md cursor-pointer'; // Add more items
      case 'reserved': return 'bg-amber-50 border-amber-300 opacity-75 cursor-not-allowed';
      case 'cleaning': return 'bg-blue-50 border-blue-300 opacity-75 cursor-not-allowed';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  return (
    <div className="h-[calc(100vh-200px)]">
      {/* Compact Header for Tablet Landscape - Reduced vertical space */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2 md:mb-3 lg:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900">POS</h1>

        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {/* Order Type */}
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-md">
            {['dine-in', 'takeaway', 'delivery'].map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium capitalize ${orderType === type
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'}`}
              >
                {type === 'dine-in' ? 'Dine In' : type === 'takeaway' ? 'Takeaway' : 'Delivery'}
              </button>
            ))}
          </div>

          {/* Section Toggle - Compact for tablets - Disabled for captains */}
          <div className="flex gap-1 sm:gap-1.5 md:gap-2 bg-gray-100 p-0.5 sm:p-0.5 md:p-1 rounded-md md:rounded-lg">
          <button
            onClick={() => user?.role !== 'captain' && setSelectedSection('lodge-dine')}
            disabled={user?.role === 'captain' && user?.section !== 'lodge-dine'}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2 rounded text-xs sm:text-sm md:text-base font-semibold transition-all ${selectedSection === 'lodge-dine'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              } ${user?.role === 'captain' && user?.section !== 'lodge-dine' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Lodge-Dine
          </button>
          <button
            onClick={() => user?.role !== 'captain' && setSelectedSection('cafe-restaurant')}
            disabled={user?.role === 'captain' && user?.section !== 'cafe-restaurant'}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2 rounded text-xs sm:text-sm md:text-base font-semibold transition-all ${selectedSection === 'cafe-restaurant'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              } ${user?.role === 'captain' && user?.section !== 'cafe-restaurant' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cafe-Restaurant
          </button>
        </div>
        </div>
      </div>

      {/* Table Tiles - Dine-in only */}
      {orderType === 'dine-in' && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TableCellsIcon className="h-4 w-4" />
            Select a table
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-3">
            {allTables.map(table => {
              const isSelected = selectedTableId === table.id;
              const isClickable = ['available', 'occupied'].includes(table.status);
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => handleTableSelect(table)}
                  disabled={!isClickable}
                  className={`min-h-[60px] sm:min-h-[70px] rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all ${getTableStatusStyle(table.status)}
                    ${isSelected ? 'ring-2 ring-primary-600 ring-offset-2' : ''}`}
                >
                  <span className="font-bold text-gray-900 text-sm sm:text-base">T{table.tableNumber}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">{table.seats} seats</span>
                  {table.status !== 'available' && (
                    <span className="text-[9px] uppercase mt-0.5 font-medium">
                      {table.status === 'occupied' ? '+ Add items' : table.status}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {allTables.length === 0 && (
            <p className="text-amber-600 text-sm py-2">No tables configured for this section. Set up tables in the Tables page.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Menu Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-3 sm:p-4 md:p-4 lg:p-6 overflow-y-auto">
          {/* Section Badge - Compact */}
          <div className="mb-2 md:mb-3 lg:mb-4 inline-block">
            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1 rounded-full text-xs sm:text-sm font-semibold ${selectedSection === 'lodge-dine'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
              }`}>
              {selectedSection === 'lodge-dine' ? '🏨 Lodge-Dine' : '☕ Cafe-Restaurant'}
            </span>
          </div>

          {!canAddItems ? (
            <div className="py-16 text-center">
              <TableCellsIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                {loadingTableOrder
                  ? 'Loading order for table...'
                  : isOccupiedTable && selectedTableId
                    ? 'Could not load order for this table. Try selecting again or choose another table.'
                    : 'Select a table above to add menu items'}
              </p>
            </div>
          ) : (
          <>
          {/* Category Filter - Compact */}
          <div className="flex gap-1 sm:gap-1.5 md:gap-2 mb-3 md:mb-4 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Search Menu Items */}
          <div className="relative mb-3 md:mb-4 lg:mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Menu Grid - Optimized for tablet landscape with smaller items */}
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="font-medium">
                {searchQuery.trim()
                  ? `No menu items match "${searchQuery}"`
                  : 'No menu items in this category'}
              </p>
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="border-2 rounded-lg p-2 sm:p-2.5 md:p-2.5 lg:p-4 cursor-pointer hover:shadow-lg hover:border-primary-500 transition-all bg-gradient-to-br from-white to-gray-50 active:scale-95 min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[160px]"
              >
                <div className="flex flex-col items-center justify-center h-full py-2 sm:py-2.5 md:py-3 lg:py-5">
                  {/* Icon based on category - Smaller on tablets */}
                  <div className="text-xl sm:text-2xl md:text-2xl lg:text-4xl mb-1 sm:mb-1.5 md:mb-1.5 lg:mb-2">
                    {item.category === 'breakfast' ? '🍳' :
                      item.category === 'beverages' ? '☕' :
                        item.category === 'appetizers' ? '🍽️' :
                          item.category === 'main-course' ? '🍛' :
                            item.category === 'desserts' ? '🍰' :
                              item.category === 'snacks' ? '🥪' : '🍴'}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1 text-xs sm:text-xs md:text-xs lg:text-base line-clamp-2 px-1">{item.name}</h3>
                  <p className="text-xs sm:text-sm md:text-sm lg:text-lg font-bold text-primary-600 mb-0.5">₹{parseFloat(item.price).toFixed(2)}</p>
                  {item.category && (
                    <p className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs text-gray-500 capitalize line-clamp-1">{item.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
          </>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold">Current Order</h2>
            <div className="flex items-center gap-2">
              {orderType === 'dine-in' && tableNumber && (
                <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm font-medium">
                  Table {tableNumber}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedSection === 'lodge-dine'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
                }`}>
                {orderType === 'dine-in' ? 'Dine In' : orderType === 'takeaway' ? 'Takeaway' : 'Delivery'}
              </span>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">₹{parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0}
            className="mt-4 w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentOrderId ? 'Add Items to Order' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
