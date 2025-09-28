import { useEffect, useState } from "react";
import type { User } from "./types";

export default function useSession() {
    const [user, setUser] = useState<User | null>(() => {
        try {
            return JSON.parse(localStorage.getItem("authUser") || "null");
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const onLogin = (e: Event) => setUser((e as CustomEvent<User>).detail);
        const onLogout = () => setUser(null);
        window.addEventListener("auth:login", onLogin as EventListener);
        window.addEventListener("auth:logout", onLogout as EventListener);
        return () => {
            window.removeEventListener("auth:login", onLogin as EventListener);
            window.removeEventListener("auth:logout", onLogout as EventListener);
        };
    }, []);

    return user;
}
