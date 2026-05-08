import { createSlice } from '@reduxjs/toolkit'
const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: false, user: null, loading: false, error: null },
  reducers: {
    loginStart(s)    { s.loading=true;  s.error=null },
    loginSuccess(s,a){ s.loading=false; s.isAuthenticated=true;  s.user=a.payload },
    loginFailure(s,a){ s.loading=false; s.error=a.payload },
    logout(s)        { s.isAuthenticated=false; s.user=null; s.error=null },
  },
})
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions
export default authSlice.reducer
