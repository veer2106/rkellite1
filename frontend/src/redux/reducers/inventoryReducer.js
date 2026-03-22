const initialState = {
  items: [],
  loading: false,
  error: null
};

const inventoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_INVENTORY_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_INVENTORY_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_INVENTORY_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default inventoryReducer;
