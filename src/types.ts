export type BookingStatus = "Pending" | "Confirmed" | "Cancelled";

export interface Booking {
    id: string;
    facility: string;
    date: string;     // "YYYY-MM-DD"
    slot: string;     // "11:00–12:00"
    notes?: string;
    status: BookingStatus;
    user?: { id: number | string; name: string; email: string };
    createdAt: string;
}
