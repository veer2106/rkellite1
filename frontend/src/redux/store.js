import { createStore, applyMiddleware, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';
import authReducer from './reducers/authReducer';
import orderReducer from './reducers/orderReducer';
import menuReducer from './reducers/menuReducer';
import inventoryReducer from './reducers/inventoryReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  orders: orderReducer,
  menu: menuReducer,
  inventory: inventoryReducer
});

const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

export default store;
