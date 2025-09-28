import React, { useState } from "react";
import useSession from "./useSession";
import type { Booking } from "./types";
import { addBooking } from "../store/bookingsSlice";

import { useAppDispatch, useAppSelector } from "../store/hooks";

const facilities = ["Conference Room A", "Conference Room B", "Auditorium", "Cafeteria"];
const defaultSlots = ["09:00–10:00", "10:00–11:00", "11:00–12:00", "14:00–15:00", "15:00–16:00"];

type Props = { onCreate?: (b: Booking) => void };



function localYMD(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}


function slotStartMinutes(slot: string) {
    const [start] = slot.split(/–|-/);            
    const [h, m] = start.split(":").map(Number);
    return h * 60 + (m || 0);
}

function isPastSlotForToday(dateStr: string, slot: string) {
    if (dateStr !== localYMD()) return false;   
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return slotStartMinutes(slot) <= nowMin;      
}



const BookingForm: React.FC<Props> = ({ onCreate }) => {
    const user = useSession();
    const [form, setForm] = useState({
        facility: facilities[0],
        date: "",
        slot: defaultSlots[0],
        notes: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const disabled = !user;

    function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
        setForm((f) => ({ ...f, [key]: val }));
    }


    const pad = (n: number) => String(n).padStart(2, "0");
    const toInputDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const MIN_DATE_ALLOW_TODAY = toInputDate(today);
    const MIN_DATE_AFTER_TODAY = toInputDate(tomorrow);
    const allBookings = useAppSelector((state) => state.bookings.all);

    const dispatch = useAppDispatch();

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (disabled || submitting) return;

        if (isPastSlotForToday(form.date, form.slot)) {
            setToast({
                type: "error",
                msg: "Please choose a future time slot for today.",
            });
            setTimeout(() => setToast(null), 2000);
            return;
        }

        // conflict detection
        const conflict = allBookings.some(
            (b) => b.date === form.date && b.slot === form.slot && b.status !== "Cancelled"
        );
        if (conflict) {
            setToast({ type: "error", msg: "A booking already exists for this date and time slot." });
            setTimeout(() => setToast(null), 2000);
            return;
        }

        setSubmitting(true);
        setToast(null);

        try {
            const booking: any & { createdAt: string } = {
                id: crypto.randomUUID(),
                facility: form.facility,
                date: form.date,
                slot: form.slot,
                notes: form.notes || undefined,
                status: "Pending",
                user: user ? { id: user.id, name: user.name, email: user.email } : undefined,
                createdAt: new Date().toISOString(),
            };

            dispatch({ type: "bookings/addBooking", payload: booking });
            onCreate?.(booking);

            await new Promise((r) => setTimeout(r, 700));

            setForm((f) => ({ ...f, notes: "" }));
            setToast({ type: "success", msg: "Your booking has been submitted successfully." });
        } catch (err) {
            setToast({ type: "error", msg: "Something went wrong. Please try again." });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 2000);
        }
    }

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold text-white">Create a Booking</h2>

            {!user && (
                <p className="rounded-lg bg-amber-500/10 text-amber-200 px-3 py-2">
                    Please sign in from the host app to book a facility.
                </p>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* Facility */}
                <div>
                    <label className="block text-sm text-white/80 mb-1.5">Facility</label>
                    <div className="relative">
                        <select
                            className="w-full rounded-lg bg-emerald-950/40 border border-white/20 p-2.5
                         text-white focus:outline-none focus:ring-2 focus:ring-emerald-400
                         focus:border-emerald-400 appearance-none"
                            value={form.facility}
                            onChange={(e) => update("facility", e.target.value)}
                        >
                            {facilities.map((f) => (
                                <option key={f} value={f} className="bg-emerald-900">
                                    {f}
                                </option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/60">
                            ▾
                        </span>
                    </div>
                </div>

                {/* Date & Slot */}
                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm text-white/80 mb-1.5">Date</label>
                        <input
                            type="date"
                            className="w-full rounded-lg bg-emerald-950/40 border border-white/20 p-2.5
                         text-white placeholder-white/40 focus:outline-none focus:ring-2
                         focus:ring-emerald-400 focus:border-emerald-400"
                            value={form.date}
                            min={MIN_DATE_ALLOW_TODAY}
                            onChange={(e) => {
                                const v = e.target.value;
                                const min = MIN_DATE_ALLOW_TODAY;
                                update("date", v && v < min ? min : v);
                            }}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/80 mb-1.5">Time Slot</label>
                        <div className="relative">
                            <select
                                className="w-full rounded-lg bg-emerald-950/40 border border-white/20 p-2.5
                           text-white focus:outline-none focus:ring-2 focus:ring-emerald-400
                           focus:border-emerald-400 appearance-none"
                                value={form.slot}
                                onChange={(e) => update("slot", e.target.value)}
                            >
                                {defaultSlots.map((s) => (
                                    <option key={s} value={s} className="bg-emerald-900">
                                        {s}
                                    </option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/60">
                                ▾
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm text-white/80 mb-1.5">Notes</label>
                    <textarea
                        rows={3}
                        className="w-full rounded-lg bg-emerald-950/40 border border-white/20 p-2.5
                       text-white placeholder-white/40
                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Agenda, special requests…"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={disabled || submitting}
                        className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-semibold
                       text-emerald-950 transition disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <span
                                    className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-900/40 border-t-emerald-900"
                                    aria-hidden="true"
                                />
                                Booking…
                            </>
                        ) : (
                            "Book Facility"
                        )}
                    </button>
                    {disabled && <span className="text-sm text-white/60">Please fill required fields</span>}
                </div>
            </form>

            {/* Toast */}
            <div
                className="pointer-events-none fixed bottom-6 right-6 z-50"
                aria-live="polite"
                aria-atomic="true"
            >
                {toast && (
                    <div
                        className={`pointer-events-auto flex justify-center flex-row items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur
              ${toast.type === "success"
                                ? "bg-emerald-900/70 border-emerald-500/30 text-emerald-100"
                                : "bg-rose-900/70 border-rose-500/30 text-rose-100"}`}
                    >
                        <div className="">
                            {toast.type === "success" ? "✅" : "⚠️"}
                        </div>
                        <div className="text-sm font-medium mt-0.5">{toast.msg}</div>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-2 rounded-lg px-2 py-0.5 text-xs text-white/70 hover:text-white"
                            aria-label="Dismiss notification"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingForm;
