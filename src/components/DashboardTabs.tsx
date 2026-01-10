"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardTabs() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Preserve existing params (from, to)
    const params = new URLSearchParams(searchParams);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const tabs = [
        { name: "Overview", href: "/" },
        { name: "Campaigns", href: "/campaigns" },
        { name: "Ads", href: "/ads" },
        { name: "Charts", href: "/comparison" },
    ];

    return (
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.name}
                        href={`${tab.href}${queryString}`}
                        className={cn(
                            "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                            isActive
                                ? "font-semibold text-indigo-600 border-b-2 border-indigo-600 -mb-px bg-indigo-50/50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
