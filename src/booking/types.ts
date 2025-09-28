export type User = {
    id: number | string;
    name: string;
    email?: string;
    role?: "Admin" | "User" | string;
};

export type Booking = {
    id: string;
    facility: string;
    date: string;       // YYYY-MM-DD
    slot: string;       // "09:00–10:00"
    notes?: string;
    status: "Pending" | "Approved" | "Cancelled";
    user?: Pick<User, "id" | "name" | "email">;
    createdAt: string;  // ISO
};

// augment window events so TS understands our custom events
declare global {
    interface WindowEventMap {
        "auth:login": CustomEvent<User>;
        "auth:logout": CustomEvent<void>;
        "booking:create": CustomEvent<Booking>;
    }
}
