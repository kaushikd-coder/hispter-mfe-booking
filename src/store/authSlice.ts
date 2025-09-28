import { createSlice, PayloadAction } from '@reduxjs/toolkit';


export type User = { id: number | string; name: string; email: string; role?: string } | null;


const initialState: { user: User } = { user: null };


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (s, a: PayloadAction<User>) => { s.user = a.payload; },
        clearUser: (s) => { s.user = null; },
    },
});


export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;