"use client";

import React, { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BedDouble,
  Wine,
  Boxes,
  BarChart2,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

type Grad = {
  id: number;
  name: string;
  classes: string; // yahi string tumhare sidebar ke bg/overlay ke liye paste hogi
};

// Tumhare overlay pattern ko constant bana diya
const overlay =
  "before:content-[''] before:absolute before:inset-0 before:pointer-events-none " +
  "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)] " +
  "before:opacity-60 before:mix-blend-soft-light";

// 19 gradients (CRM-friendly)
const gradients: Grad[] = [
  { id: 1, name: "Teal → Blue",
    classes: `relative bg-gradient-to-b from-teal-500 to-blue-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 2, name: "Indigo → Purple",
    classes: `relative bg-gradient-to-b from-indigo-500 to-purple-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 3, name: "Rose → Orange",
    classes: `relative bg-gradient-to-b from-rose-500 to-orange-400 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 4, name: "Emerald → Lime",
    classes: `relative bg-gradient-to-b from-emerald-500 to-lime-400 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 5, name: "Cyan → Sky",
    classes: `relative bg-gradient-to-b from-cyan-500 to-sky-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 6, name: "Amber → Orange",
    classes: `relative bg-gradient-to-b from-amber-400 to-orange-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 7, name: "Fuchsia → Pink",
    classes: `relative bg-gradient-to-b from-fuchsia-500 to-pink-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 8, name: "Slate → Zinc (Dark)",
    classes: `relative bg-gradient-to-b from-slate-700 to-zinc-900 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id: 9, name: "Violet → Indigo",
    classes: `relative bg-gradient-to-b from-violet-500 to-indigo-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:10, name: "Red → Rose",
    classes: `relative bg-gradient-to-b from-red-500 to-rose-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:11, name: "Green → Emerald → Teal",
    classes: `relative bg-gradient-to-b from-green-500 via-emerald-500 to-teal-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:12, name: "Blue → Sky → Cyan",
    classes: `relative bg-gradient-to-b from-blue-500 via-sky-500 to-cyan-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:13, name: "Stone → Neutral",
    classes: `relative bg-gradient-to-b from-stone-400 to-neutral-600 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:14, name: "Purple → Fuchsia → Pink",
    classes: `relative bg-gradient-to-b from-purple-500 via-fuchsia-500 to-pink-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:15, name: "Orange → Amber → Yellow",
    classes: `relative bg-gradient-to-b from-orange-500 via-amber-400 to-yellow-400 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:16, name: "Lime → Green → Emerald",
    classes: `relative bg-gradient-to-b from-lime-400 via-green-500 to-emerald-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:17, name: "Sky → Cyan → Indigo",
    classes: `relative bg-gradient-to-b from-sky-500 via-cyan-500 to-indigo-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:18, name: "Pink → Rose → Red",
    classes: `relative bg-gradient-to-b from-pink-500 via-rose-500 to-red-500 dark:from-gray-900 dark:to-gray-800 ${overlay}` },
  { id:19, name: "Monochrome Deep",
    classes: `relative bg-gradient-to-b from-zinc-800 via-neutral-900 to-black dark:from-black dark:via-neutral-900 dark:to-zinc-800 ${overlay}` },
];

// Sidebar items (same as tumhare)
const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Bookings", path: "/bookings", icon: Calendar },
  { name: "Rooms", path: "/rooms", icon: BedDouble },
  { name: "Bar / POS", path: "/bar", icon: Wine },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Reports", path: "/reports", icon: BarChart2 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function GradientSidebarPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [activePath, setActivePath] = useState("/dashboard"); // preview ke liye local state
  const [selected, setSelected] = useState<Grad>(gradients[0]);

  const sidebarShell =
    "text-white min-h-[520px] h-full flex flex-col shadow-lg border-b border-white/20";

  const sidebarClass = clsx(selected.classes, sidebarShell);

  const copyClasses = async () => {
    try {
      await navigator.clipboard.writeText(`className="${selected.classes}"`);
      alert("Gradient classes copied!");
    } catch {
      alert("Copy failed — manually copy the string.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Sidebar Gradient Gallery
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Click a gradient to preview on the sidebar · Use Copy to grab the exact Tailwind classes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              {isOpen ? "Collapse" : "Expand"}
            </button>
            <button
              onClick={copyClasses}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:opacity-90"
            >
              Copy classes
            </button>
          </div>
        </div>

        {/* Preview + Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Preview */}
          <motion.aside
            initial={{ width: isOpen ? 256 : 80 }}
            animate={{ width: isOpen ? 256 : 80 }}
            transition={{ duration: 0.25 }}
            className={sidebarClass}
          >
            {/* Logo / Brand */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer border-b border-white/20"
              onClick={() => setIsOpen((v) => !v)}
            >
              <div className="bg-white text-indigo-700 p-2 rounded-lg font-bold text-lg shadow-md">
                BS
              </div>
              {isOpen && (
                <span className="text-xl font-bold tracking-wide">
                  CRM Dashboard
                </span>
              )}
            </div>

            {/* Nav */}
            <nav className="mt-4 flex-1 px-1">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activePath.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      {/* Link is fine for visual; onClick se activePath update kar rahe */}
                      <Link
                        href={item.path}
                        onClick={(e) => {
                          e.preventDefault();
                          setActivePath(item.path);
                        }}
                        data-tooltip-id={`tip-${item.name}`}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-white/20 backdrop-blur-sm shadow-sm scale-[1.02]"
                            : "hover:bg-white/10"
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && <span>{item.name}</span>}
                      </Link>
                      {!isOpen && (
                        <Tooltip
                          id={`tip-${item.name}`}
                          place="right"
                          style={{
                            backgroundColor: "#0f172a",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                          }}
                        >
                          {item.name}
                        </Tooltip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </motion.aside>

          {/* Palette Grid */}
          <section className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {gradients.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className={clsx(
                    "group relative rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-transparent overflow-hidden",
                    // palette card background equals sidebar gradient but horizontal
                    g.classes.replace("bg-gradient-to-b", "bg-gradient-to-r"),
                    selected.id === g.id
                      ? "ring-2 ring-emerald-500"
                      : "hover:scale-[1.01] transition-transform"
                  )}
                  title="Apply to preview"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-xs opacity-80">#{g.id}</span>
                  </div>
                  <p className="text-xs opacity-90 mt-2 text-left select-text">
                    {`className="${g.classes}"`}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
