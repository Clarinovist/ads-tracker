import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        label?: string;
        isPositive: boolean;
    };
    className?: string;
    iconColor?: string;
    variant?: "default" | "gradient";
}

export function MetricsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconColor = "text-indigo-600",
    variant = "default",
}: MetricsCardProps) {
    // Generate pastel background based on iconColor
    const getBgGradient = () => {
        if (variant === "gradient") {
            if (iconColor.includes("indigo")) return "bg-gradient-to-br from-indigo-50/80 via-white to-white border-l-4 border-l-indigo-500";
            if (iconColor.includes("purple")) return "bg-gradient-to-br from-purple-50/80 via-white to-white border-l-4 border-l-purple-500";
            if (iconColor.includes("emerald") || iconColor.includes("green")) return "bg-gradient-to-br from-emerald-50/80 via-white to-white border-l-4 border-l-emerald-500";
            if (iconColor.includes("amber") || iconColor.includes("orange")) return "bg-gradient-to-br from-amber-50/80 via-white to-white border-l-4 border-l-amber-500";
            if (iconColor.includes("rose") || iconColor.includes("red")) return "bg-gradient-to-br from-rose-50/80 via-white to-white border-l-4 border-l-rose-500";
            if (iconColor.includes("blue")) return "bg-gradient-to-br from-blue-50/80 via-white to-white border-l-4 border-l-blue-500";
            if (iconColor.includes("sky")) return "bg-gradient-to-br from-sky-50/80 via-white to-white border-l-4 border-l-sky-500";
            return "bg-gradient-to-br from-slate-50/80 via-white to-white border-l-4 border-l-slate-500";
        }
        return "";
    };

    return (
        <Card className={cn(
            "overflow-hidden border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group",
            getBgGradient(),
            className
        )}>
            <CardContent className="p-5 md:p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>

                        {/* Trend indicator with label */}
                        {trend && (
                            <div className="flex items-center gap-2 pt-1">
                                <div className={cn(
                                    "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                                    trend.isPositive
                                        ? "text-emerald-700 bg-emerald-50"
                                        : "text-rose-700 bg-rose-50"
                                )}>
                                    {trend.isPositive
                                        ? <TrendingUp className="h-3 w-3" />
                                        : <TrendingDown className="h-3 w-3" />
                                    }
                                    {trend.value}%
                                </div>
                                {trend.label && (
                                    <span className="text-xs text-slate-400">{trend.label}</span>
                                )}
                            </div>
                        )}

                        {description && !trend && (
                            <p className="text-xs text-slate-400 pt-1">{description}</p>
                        )}
                    </div>

                    <div className={cn(
                        "p-3 rounded-xl transition-transform group-hover:scale-110 duration-300",
                        iconColor.replace("text-", "bg-").replace(/600$/, "100").replace(/500$/, "100")
                    )}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                </div>

                {description && trend && (
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}
