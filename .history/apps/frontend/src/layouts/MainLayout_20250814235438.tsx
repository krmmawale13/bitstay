import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Toaster } from "react-hot-toast";

export default function MainLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={title} />
        <main className="p-6 bg-secondary flex-1">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
