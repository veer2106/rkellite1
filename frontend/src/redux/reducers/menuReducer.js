const initialState = {
  menuItems: [],
  loading: false,
  error: null
};

const menuReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_MENU_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_MENU_SUCCESS':
      return { ...state, loading: false, menuItems: action.payload };
    case 'FETCH_MENU_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default menuReducer;
