export type User = {
    id: number | string;
    name: string;
    email?: string;
    role?: "Admin" | "User" | string;
};

export type Booking = {
    id: string;
    facility: string;
    date: string;       
    slot: string;       
    notes?: string;
    status: "Pending" | "Approved" | "Cancelled";
    user?: Pick<User, "id" | "name" | "email">;
    createdAt: string;  
};


declare global {
    interface WindowEventMap {
        "auth:login": CustomEvent<User>;
        "auth:logout": CustomEvent<void>;
        "booking:create": CustomEvent<Booking>;
    }
}
