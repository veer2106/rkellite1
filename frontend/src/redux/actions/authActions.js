import api from '../../services/api';
import { toast } from 'react-toastify';

export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAIL = 'LOGIN_FAIL';
export const LOGOUT = 'LOGOUT';
export const USER_LOADED = 'USER_LOADED';
export const AUTH_ERROR = 'AUTH_ERROR';

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const { data } = await api.post('/auth/login', { email, password });

    dispatch({
      type: LOGIN_SUCCESS,
      payload: data.data
    });

    localStorage.setItem('token', data.data.token);
    toast.success('Login successful!');
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: error.response?.data?.message || 'Login failed'
    });
    toast.error(error.response?.data?.message || 'Login failed');
  }
};

export const loadUser = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    dispatch({ type: AUTH_ERROR });
    return;
  }

  try {
    const { data } = await api.get('/auth/me');

    dispatch({
      type: USER_LOADED,
      payload: data.data
    });
  } catch (error) {
    dispatch({ type: AUTH_ERROR });
  }
};

export const logout = () => (dispatch) => {
  localStorage.removeItem('token');
  dispatch({ type: LOGOUT });
  toast.success('Logged out successfully');
};
