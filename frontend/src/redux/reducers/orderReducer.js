const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  stats: null
};

const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_ORDERS_REQUEST':
    case 'CREATE_ORDER_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_ORDERS_SUCCESS':
      return { ...state, loading: false, orders: action.payload };
    case 'CREATE_ORDER_SUCCESS':
      return { ...state, loading: false, orders: [action.payload, ...state.orders] };
    case 'FETCH_ORDERS_FAIL':
    case 'CREATE_ORDER_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default orderReducer;
