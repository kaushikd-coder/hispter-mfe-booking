export type BookingStatus = "Pending" | "Confirmed" | "Cancelled";

export interface Booking {
    id: string;
    facility: string;
    date: string;     
    slot: string;     
    notes?: string;
    status: BookingStatus;
    user?: { id: number | string; name: string; email: string };
    createdAt: string;
}
