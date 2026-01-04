"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncButton } from "./SyncButton";

const items = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Live Monitor",
        url: "/live",
        icon: Activity,
    },
    {
        title: "Manage Businesses",
        url: "/businesses",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight">Ads Tracker</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {items.map((item) => (
                    <Link
                        key={item.title}
                        href={item.url}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-800",
                            pathname === item.url ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
                <SyncButton />
                <p className="text-xs text-center text-slate-500">v1.0.0</p>
            </div>
        </div>
    );
}
