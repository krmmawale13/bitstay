// apps/frontend/src/pages/customers/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import {
  getCustomers,
  type Customer,
  deleteCustomer,
} from "@/services/customers.service";
import {
  Users,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  IdCard,
  MapPin,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { useRouter } from "next/router";

/* ---------------- helpers ---------------- */
function rel(dt?: string | null) {
  if (!dt) return "—";
  const t = new Date(dt).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);
  return m > 0 ? `${m}m ago` : "just now";
}
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function exportCsv(rows: Customer[]) {
  const head = ["ID", "Name", "Email", "Phone", "Consent", "UpdatedAt"];
  const lines = rows.map((c) => [
    c.id,
    c.name,
    c.email ?? "",
    c.phone ?? "",
    (c as any).consent ? "Yes" : "No",
    c.updatedAt ?? "",
  ]);
  const csv = [head, ...lines]
    .map((r) =>
      r
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- page ---------------- */
export default function CustomersIndexPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // view state (persisted)
  const [q, setQ] = useState("");
  const [filterKyc, setFilterKyc] = useState(false);
  const [filterAddr, setFilterAddr] = useState(false);
  const [filterConsent, setFilterConsent] = useState(false);
  const [sortKey, setSortKey] = useState<"name" | "updatedAt">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // load once
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load customers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // restore view state
    try {
      const saved = JSON.parse(
        localStorage.getItem("custIndexView") || "{}"
      );
      if (saved.q) setQ(saved.q);
      if (typeof saved.filterKyc === "boolean") setFilterKyc(saved.filterKyc);
      if (typeof saved.filterAddr === "boolean")
        setFilterAddr(saved.filterAddr);
      if (typeof saved.filterConsent === "boolean")
        setFilterConsent(saved.filterConsent);
      if (saved.sortKey) setSortKey(saved.sortKey);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (saved.page) setPage(saved.page);
    } catch {}
    load();
  }, []);
  useEffect(() => {
    // persist view state
    localStorage.setItem(
      "custIndexView",
      JSON.stringify({
        q,
        filterKyc,
        filterAddr,
        filterConsent,
        sortKey,
        sortDir,
        page,
      })
    );
  }, [q, filterKyc, filterAddr, filterConsent, sortKey, sortDir, page]);

  // keyboard: / to focus search
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    try {
      setDeletingId(id);
      await deleteCustomer(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  // derived status (frontend-only)
  const getHasKyc = (c: Customer) =>
    !!((c as any).idTypeId || (c as any).idType) && !!(c as any).idNumber;
  const getHasAddr = (c: Customer) => (c.addresses?.length ?? 0) > 0;
  const getConsent = (c: Customer) => !!(c as any).consent;

  // filter + sort + paginate (client-side)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = rows.filter((c) => {
      const text = `${c.id} ${c.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
      if (s && !text.includes(s)) return false;
      if (filterKyc && !getHasKyc(c)) return false;
      if (filterAddr && !getHasAddr(c)) return false;
      if (filterConsent && !getConsent(c)) return false;
      return true;
    });

    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") {
        return dir * String(a.name ?? "").localeCompare(String(b.name ?? ""));
      } else {
        // updatedAt
        const ta = new Date(a.updatedAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? 0).getTime();
        return dir * (ta - tb);
      }
    });

    return arr;
  }, [rows, q, filterKyc, filterAddr, filterConsent, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // prefetch dashboard on hover (nice!)
  const prefetchDash = (id: number) => {
    router.prefetch(`/customers/${id}/customerdashboard`).catch(() => {});
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Users size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Customers
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtered.length} of {rows.length} records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* search */}
            <div className="relative">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, phone…  ( / to focus )"
                className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <Search
                size={16}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* export */}
            <button
              onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
              title="Export CSV"
            >
              <Download size={16} />
              Export
            </button>

            {/* create */}
            <Link
              href="/customers/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                         shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New
            </Link>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            active={filterKyc}
            onClick={() => {
              setFilterKyc((v) => !v);
              setPage(1);
            }}
            icon={<IdCard size={14} />}
            label="Has KYC"
          />
          <FilterChip
            active={filterAddr}
            onClick={() => {
              setFilterAddr((v) => !v);
              setPage(1);
            }}
            icon={<MapPin size={14} />}
            label="Has Address"
          />
          <FilterChip
            active={filterConsent}
            onClick={() => {
              setFilterConsent((v) => !v);
              setPage(1);
            }}
            icon={<Check size={14} />}
            label="Consent Yes"
          />

          <div className="ml-auto flex items-center gap-2">
            <SortButton
              label="Name"
              active={sortKey === "name"}
              dir={sortKey === "name" ? sortDir : undefined}
              onClick={() => {
                if (sortKey === "name") {
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                } else {
                  setSortKey("name");
                  setSortDir("asc");
                }
              }}
            />
            <SortButton
              label="Updated"
              active={sortKey === "updatedAt"}
              dir={sortKey === "updatedAt" ? sortDir : undefined}
              onClick={() => {
                if (sortKey === "updatedAt") {
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                } else {
                  setSortKey("updatedAt");
                  setSortDir("desc");
                }
              }}
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
            <div className="font-semibold">Couldn’t load customers</div>
            <div className="opacity-80">{error}</div>
            <button
              onClick={load}
              className="mt-2 inline-flex items-center rounded px-3 py-1 text-white bg-rose-600 hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No customers found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr className="text-left">
                      <Th>ID</Th>
                      <Th>Name</Th>
                      <Th>Contact</Th>
                      <Th>Status</Th>
                      <Th>Updated</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((c) => {
                      const kyc = getHasKyc(c);
                      const addr = getHasAddr(c);
                      const consent = getConsent(c);
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(
                              `/customers/${c.id}/customerdashboard`
                            )
                          }
                          onMouseEnter={() => prefetchDash(c.id)}
                        >
                          <Td>#{c.id}</Td>
                          <Td className="font-medium text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs">
                                {String(c.name ?? "C").charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[28ch]">
                                {c.name}
                              </span>
                            </div>
                          </Td>
                          <Td className="text-slate-700 dark:text-slate-300">
                            <div className="flex flex-col">
                              <span title={c.email || ""}>
                                {c.email || "—"}
                              </span>
                              <span
                                className="text-xs text-slate-500"
                                title={c.phone || ""}
                              >
                                {c.phone || "—"}
                              </span>
                            </div>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <Chip
                                active={kyc}
                                icon={<IdCard size={14} />}
                                label="KYC"
                              />
                              <Chip
                                active={addr}
                                icon={<MapPin size={14} />}
                                label="Addr"
                              />
                              <Chip
                                active={consent}
                                icon={<Check size={14} />}
                                label="Consent"
                              />
                            </div>
                          </Td>
                          <Td className="text-slate-600 dark:text-slate-300">
                            {rel(c.updatedAt)}
                          </Td>
                          <Td
                            className="text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/customers/${c.id}/customerdashboard`}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                           bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                                title="View"
                              >
                                <Eye size={16} />
                                View
                              </Link>
                              <Link
                                href={`/customers/${c.id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                           bg-amber-500/90 hover:bg-amber-500 transition shadow-sm"
                                title="Edit"
                              >
                                <Pencil size={16} />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(c.id)}
                                disabled={deletingId === c.id}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                           bg-rose-600 hover:bg-rose-500 disabled:opacity-60 transition shadow-sm"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                                {deletingId === c.id ? "Deleting…" : "Delete"}
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm">
                <div className="text-slate-600 dark:text-slate-300">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> •{" "}
                  Showing{" "}
                  <strong>
                    {(page - 1) * perPage + 1}-
                    {Math.min(page * perPage, filtered.length)}
                  </strong>{" "}
                  of <strong>{filtered.length}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

/* ---------- tiny cells ---------- */
function Th(
  { children, className = "", ...rest }:
  React.ThHTMLAttributes<HTMLTableHeaderCellElement>
) {
  return (
    <th
      {...rest}
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function Td(
  { children, className = "", colSpan, ...rest }:
  React.TdHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <td
      {...rest}
      colSpan={colSpan}
      className={`whitespace-nowrap px-4 py-3 ${className}`}
    >
      {children}
    </td>
  );
}

/* ---------- UI chips ---------- */
function Chip({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1",
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800"
          : "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
      )}
      title={label}
    >
      {icon}
      {label}
    </span>
  );
}
function FilterChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 transition",
        active
          ? "bg-blue-600/10 text-blue-700 ring-blue-300 hover:bg-blue-600/20 dark:text-blue-200 dark:ring-blue-800"
          : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active?: boolean;
  dir?: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cls(
        "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs ring-1 transition",
        active
          ? "bg-white ring-slate-200 text-slate-900 dark:bg-slate-800 dark:ring-slate-700 dark:text-slate-200"
          : "bg-transparent ring-slate-200 text-slate-600 hover:bg-white dark:ring-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
      title={`Sort by ${label}`}
    >
      <ArrowUpDown size={14} />
      {label}
      {active && dir ? <span className="ml-1 opacity-70">({dir})</span> : null}
    </button>
  );
}
