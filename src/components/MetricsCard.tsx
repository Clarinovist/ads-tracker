

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    className?: string;
    iconColor?: string;
}

export function MetricsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconColor = "text-blue-500",
}: MetricsCardProps) {
    return (
        <Card className={cn("overflow-hidden border-slate-200/60 shadow-sm", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
                    </div>
                    <div className={cn("p-2 rounded-lg bg-slate-50", iconColor.replace("text-", "bg-").replace("500", "50"))}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                </div>

                {(description || trend) && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend && (
                            <span className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded",
                                trend.isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                            )}>
                                {trend.isPositive ? "+" : ""}{trend.value}%
                            </span>
                        )}
                        {description && (
                            <p className="text-xs text-slate-500 truncate">{description}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
