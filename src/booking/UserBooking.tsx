import React, { useState } from "react";
import "../index.css"; 
import BookingForm from "./BookingForm";
import BookingList from "./BookingList";
import useSession from "./useSession";

const tabs = [
    { id: "new", label: "New Booking" },
    { id: "list", label: "My Bookings" },
] as const;

const cx = (...c: Array<string | false | null | undefined>) =>
    c.filter(Boolean).join(" ");

const UserBooking: React.FC = () => {
    const user = useSession();
    const [active, setActive] = useState<typeof tabs[number]["id"]>("new");

    return (
        <div className="relative px-4 py-8 sm:px-6 md:px-8 lg:px-10">
            {/* soft gradient backdrop */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(20,184,166,0.18),transparent_60%)]" />

            <section className="relative z-10 mx-auto w-full max-w-7xl">
                {/* Header */}
                <header className="mb-6 md:mb-8">
                    <h1 className="text-pretty text-2xl font-bold leading-tight text-white md:text-3xl">
                        Booking Section
                    </h1>
                    <p className="mt-1 text-sm text-white/70 md:text-base">
                        {user ? `Welcome, ${user.name}!` : "You’re viewing as a guest."}
                    </p>
                </header>

                {/* Tabs */}
                <div
                    role="tablist"
                    aria-label="Booking tabs"
                    className="rounded-xl border border-white/10 bg-emerald-900/30 p-1.5 backdrop-blur"
                >
                    <div className="grid grid-cols-2 gap-1.5">
                        {tabs.map((t) => {
                            const selected = active === t.id;
                            return (
                                <button
                                    key={t.id}
                                    role="tab"
                                    aria-selected={selected}
                                    aria-controls={`panel-${t.id}`}
                                    id={`tab-${t.id}`}
                                    onClick={() => setActive(t.id)}
                                    className={cx(
                                        "w-full rounded-lg px-3 py-2.5 text-center text-sm font-medium transition",
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700",
                                        selected
                                            ? "bg-emerald-600 text-white shadow"
                                            : "text-emerald-100 hover:bg-emerald-500/20 hover:text-white"
                                    )}
                                    type="button"
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Panels */}
                <div className="mt-4 rounded-xl border border-white/10 bg-emerald-900/25 p-3 sm:p-4 md:mt-6 md:p-6">
                    
                    <div className="max-h-[70vh] overflow-auto md:max-h-[68vh]">
                        {/* New Booking */}
                        <section
                            role="tabpanel"
                            id="panel-new"
                            aria-labelledby="tab-new"
                            hidden={active !== "new"}
                            className={cx(active === "new" && "animate-fade-in")}
                        >
                            <div className=" w-full ">
                                <BookingForm />
                            </div>
                        </section>

                        {/* My Bookings */}
                        <section
                            role="tabpanel"
                            id="panel-list"
                            aria-labelledby="tab-list"
                            hidden={active !== "list"}
                            className={cx(active === "list" && "animate-fade-in")}
                        >
                            <div className=" w-full ">
                                <BookingList />
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default UserBooking;
