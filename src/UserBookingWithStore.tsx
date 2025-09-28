import React from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import UserBooking from "./booking/UserBooking";

export default function UserBookingWithStore() {
  return (
      <UserBooking />
  );
}
