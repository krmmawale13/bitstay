export default function Topbar({ title }: { title: string }) {
  return (
    <header className="flex justify-between items-center p-4 border-b bg-white">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="text-primary font-medium">Dark Mode</button>
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
      </div>
    </header>
  );
}
