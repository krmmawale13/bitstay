// components/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#007B83] text-white p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">BitStay</h2>
      <nav className="space-y-2">
        <Link href="/dashboardPage" className="block hover:bg-[#1E90A1] p-2 rounded">
          Dashboard
        </Link>
        <Link href="/bookingPage" className="block hover:bg-[#1E90A1] p-2 rounded">
          Bookings
        </Link>
        <Link href="/customerPage" className="block hover:bg-[#1E90A1] p-2 rounded">
          Customers
        </Link>
      </nav>
    </aside>
  );
}
