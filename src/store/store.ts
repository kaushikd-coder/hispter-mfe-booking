import { configureStore } from "@reduxjs/toolkit";
import bookings from "./bookingsSlice";

export const store = configureStore({
  reducer: { bookings },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
