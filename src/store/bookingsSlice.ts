import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Booking } from "../types";

type BookingsState = {
    all: Booking[];
};

const seed: Booking[] = [
   
];

const initialState: BookingsState = { all: seed };

const bookingsSlice = createSlice({
    name: "bookings",
    initialState,
    reducers: {
        addBooking: (state, action: PayloadAction<Booking>) => {
            state.all.unshift(action.payload);
        },
        cancelBooking: (state, action: PayloadAction<string>) => {
            const booking = state.all.find((b) => b.id === action.payload);
            if (booking) booking.status = "Cancelled";
        },
        updateBookingStatus: (
            state,
            action: PayloadAction<{ id: string; status: any }>
        ) => {
            const booking = state.all.find((b) => b.id === action.payload.id);
            if (booking) booking.status = action.payload.status;
        },
    }

});

export const { addBooking, cancelBooking,updateBookingStatus } = bookingsSlice.actions;
export default bookingsSlice.reducer;
export const bookingsReducer = bookingsSlice.reducer;

// Selectors
export const selectAllBookings = (s: { bookings: BookingsState }) => s.bookings.all;

export const makeSelectVisibleBookings = (user?: { id: string | number; role?: string }) => {
    return (s: { bookings: BookingsState }) => {
        const rows = s.bookings.all;
        if (!user) return rows;
        return user.role === "Admin" ? rows : rows.filter(r => r.user?.id === user.id);
    };
};

export const selectBookingsCount = (s: { bookings: BookingsState }) => s.bookings.all.length;
