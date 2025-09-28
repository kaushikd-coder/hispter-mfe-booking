import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useSession from "./useSession";
import type { Booking } from "./types";
import {
  cancelBooking,
  makeSelectVisibleBookings,
  updateBookingStatus,
} from "../store/bookingsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSelector } from "react-redux";

const PAGE_SIZE = 5;

const statusClass: Record<string, string> = {
  Approved: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20",
  Pending: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20",
  Cancelled: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20",
  default: "bg-white/10 text-white/80 ring-1 ring-white/10",
};

// icons
const Check = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M7.5 13.5 4.5 10.5 3 12l4.5 4.5L17 7l-1.5-1.5z" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 opacity-80" fill="currentColor" aria-hidden="true">
    <path d="M5.8 7.5 10 11.7l4.2-4.2 1.3 1.3-5.5 5.5-5.5-5.5z" />
  </svg>
);

type StatusValue = "Pending" | "Approved" | "Cancelled";
type StatusMenuProps = {
  value: StatusValue;
  onChange: (v: StatusValue) => void;
  disabled?: boolean;
};

/** ---------- Portal helpers ---------- */

function useIsomorphicLayoutEffect(fn: React.EffectCallback, deps: React.DependencyList) {
  const useLE = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
  useLE(fn, deps);
}

function MenuPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

/** ---------- Status dropdown with portal ---------- */

const StatusMenu: React.FC<StatusMenuProps> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const options: StatusValue[] = ["Pending", "Approved", "Cancelled"];

  useEffect(() => {
    setActiveIdx(Math.max(0, options.findIndex((o) => o === value)));
  }, [value]);

  // keyboard interactions
  function handleKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      btnRef.current?.focus();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(options.length - 1, i + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = options[activeIdx];
      if (sel && sel !== value) onChange(sel);
      setOpen(false);
      btnRef.current?.focus();
    }
  }

  return (
    <div className="relative inline-block text-left" onKeyDown={handleKey}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold
                   border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 transition
                   disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-md px-2 py-0.5 ring-1 text-xs font-medium
                      ${statusClass[value] ?? statusClass.default}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
          {value}
        </span>
        <Chevron />
      </button>

      {open && btnRef.current && (
        <AnchoredMenu
          anchor={btnRef.current}
          value={value}
          options={options}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          onSelect={(opt) => {
            if (opt !== value) onChange(opt);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

function AnchoredMenu({
  anchor,
  value,
  options,
  activeIdx,
  setActiveIdx,
  onSelect,
  onClose,
}: {
  anchor: HTMLElement;
  value: StatusValue;
  options: StatusValue[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onSelect: (v: StatusValue) => void;
  onClose: () => void;
}) {
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 176,
    openUp: false,
  });

  // place near anchor (right-aligned), flip if needed
  const place = React.useCallback(() => {
    const r = anchor.getBoundingClientRect();
    const width = 176; // w-44
    const margin = 8;

    // initial: open downward
    let top = r.bottom + margin;
    let left = r.right - width;

    // clamp left within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    // if not enough space below, flip upward (after measuring menu height)
    let openUp = false;
    const menuH = menuRef.current?.offsetHeight ?? 0;
    if (window.innerHeight - r.bottom < (menuH || 160) + margin) {
      openUp = true;
      top = r.top - margin - (menuH || 160);
    }

    setPos({ top, left, width, openUp });
  }, [anchor]);

  useIsomorphicLayoutEffect(() => {
    place();
  }, [place]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchor.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onScroll = () => place();
    const onResize = () => place();

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [anchor, onClose, place]);

  return (
    <MenuPortal>
      <div
        ref={menuRef}
        className="fixed z-50 overflow-hidden rounded-lg border border-white/10 bg-emerald-950/95 shadow-2xl backdrop-blur"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        onClick={(e) => e.stopPropagation()}
      >
        {options.map((opt, idx) => {
          const isActive = idx === activeIdx;
          const isSelected = opt === value;
          return (
            <button
              key={opt}
              role="menuitem"
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs text-white/90 ${isActive ? "bg-white/10" : "hover:bg-white/10"
                }`}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => onSelect(opt)}
            >
              <span>{opt}</span>
              {isSelected && (
                <span className="text-emerald-300">
                  <Check />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </MenuPortal>
  );
}

/** ---------- Booking list ---------- */

const BookingList: React.FC = () => {
  const sessionUser = useSession();
  const dispatch = useAppDispatch();

  const all = useSelector((s: any) => s.bookings?.all ?? []);


  // Selector that adapts to current user visibility
  const selectVisible = useMemo(
    () => makeSelectVisibleBookings(sessionUser ?? undefined),
    [sessionUser]
  );
  // const rows = useAppSelector(selectVisible);

  const user: any = useSession();
  const userBookings: Booking[] = useSelector((s: any) => s.bookings?.all ?? []);

  const rows = useMemo(() => {
    if (!user?.email) return [];

    // 👇 Admin can see all bookings
    if (user.email === "admin@example.com") {
      return userBookings;
    }

    // 👇 Regular users only see their own
    return userBookings.filter((b: any) => b.user?.email === user.email);
  }, [userBookings, user]);

  console.log({ rows })

  const changeStatus = (id: string, status: StatusValue) =>
    dispatch(updateBookingStatus({ id, status }));

  // Guard for non-admins
  const visible = useMemo(() => {
    if (!user) return [];

    // treat either role or hardcoded email as admin
    const isAdmin = user.role === "Admin" || user.email === "admin@example.com";
    if (isAdmin) return userBookings;

    const myEmail = (user.email ?? "").toLowerCase();
    return userBookings.filter(
      (b) => (b.user?.email ?? "").toLowerCase() === myEmail
    );
  }, [userBookings, user]);



  // Pagination
  const [page, setPage] = useState(1);
  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const pageData = useMemo(() => visible.slice(startIdx, endIdx), [visible, startIdx, endIdx]);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const cancel = (id: string) => dispatch(cancelBooking(id));

  return (
    <div className="w-full rounded-2xl py-4  ">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-white">Your Bookings</h2>
        <span className="text-xs sm:text-sm text-white/70">
          {total === 0 ? "0 total" : `${startIdx + 1}-${endIdx} of ${total}`}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        {/* ---------- Mobile list (xs) ---------- */}
        <div className="sm:hidden divide-y divide-white/10">
          {pageData.length > 0 ? (
            pageData.map((b) => (
              <div key={b.id} className="p-4 bg-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-medium text-white">{b.facility}</div>
                    <div className="mt-1 text-xs text-white/80">
                      <span className="inline-block mr-3">{b.date}</span>
                      <span className="inline-block">{b.slot}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg px-2 py-0.5 text-xs font-medium
                                ${statusClass[b.status] ?? statusClass.default}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                        {b.status}
                      </span>
                      <span className="text-white/70">•</span>
                      <span className="inline-flex items-center gap-2 text-white/90">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[10px] text-white/80">
                          {(b.user?.name ?? "—").slice(0, 1).toUpperCase()}
                        </span>
                        {b.user?.name ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {sessionUser?.role !== "Admin" && (
                      <button
                        onClick={() => cancel(b.id)}
                        disabled={b.status === "Cancelled"}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-white
                               bg-rose-600/90 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    )}

                    {sessionUser?.role === "Admin" && (
                      <StatusMenu
                        value={b.status as StatusValue}
                        onChange={(next) => changeStatus(b.id, next)}
                        disabled={b.status === "Cancelled"}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 px-4 text-center text-white/70">No bookings yet.</div>
          )}
        </div>

        {/* ---------- Table (sm+) ---------- */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-emerald-900/60 backdrop-blur text-left text-white/80">
                <tr className="[&>th]:py-3 [&>th]:px-4">
                  <th className="w-[22%]">Facility</th>
                  <th className="w-[16%]">Date</th>
                  <th className="w-[16%]">Slot</th>
                  <th className="w-[16%]">Status</th>
                  <th className="w-[18%]">Booked By</th>
                  <th className="w-[12%] text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {pageData.map((b) => (
                  <tr key={b.id} className="align-top transition hover:bg-white/5 even:bg-white/5/30">
                    <td className="py-3 px-4 text-white">{b.facility}</td>
                    <td className="py-3 px-4 text-white/90">{b.date}</td>
                    <td className="py-3 px-4 text-white/90">{b.slot}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-medium
                                ${statusClass[b.status] ?? statusClass.default}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/90">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs text-white/80">
                          {(b.user?.name ?? "—").slice(0, 1).toUpperCase()}
                        </div>
                        <span>{b.user?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        {sessionUser?.role !== "Admin" && (
                          <button
                            onClick={() => cancel(b.id)}
                            disabled={b.status === "Cancelled"}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white
                                   bg-rose-600/90 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        )}

                        {sessionUser?.role === "Admin" && (
                          <StatusMenu
                            value={b.status as StatusValue}
                            onChange={(next) => changeStatus(b.id, next)}
                            disabled={b.status === "Cancelled"}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {total === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-white/70">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 bg-emerald-950/40 px-3 sm:px-4 py-3">
            {/* Optional: show range on larger screens */}
            <div className="hidden sm:block text-xs text-white/60">
              Showing <span className="text-white/90">{startIdx + 1}</span>–
              <span className="text-white/90">{endIdx}</span> of{" "}
              <span className="text-white/90">{total}</span>
            </div>

            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹ Prev
              </button>

              <div className="hidden xs:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, Math.min(page - 3, totalPages - 5)),
                    Math.max(5, Math.min(totalPages, page + 2))
                  )
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-md text-xs font-medium ${p === page
                          ? "bg-emerald-500 text-emerald-950"
                          : "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
                        }`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ))}
              </div>

              {/* Compact pager for tiny phones */}
              <div className="xs:hidden text-xs text-white/80">
                Page {page} / {totalPages}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 disabled:opacity-40"
                aria-label="Next page"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

  );
};

export default BookingList;
