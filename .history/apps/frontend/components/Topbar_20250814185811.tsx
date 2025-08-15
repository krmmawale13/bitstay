// components/Topbar.tsx
export default function Topbar() {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <span className="text-lg font-semibold">Dashboard</span>
      <div className="flex items-center gap-4">
        <button className="p-2 bg-[#F9B24E] rounded-full text-white">N</button>
      </div>
    </header>
  );
}
