"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LineChart as LineIcon } from "lucide-react";
import { formatINR, formatCompact } from "@/lib/utils";

const PRIMARY = "#0060E6";
const ACCENT = "#00B6F0";
const PALETTE = ["#0060E6", "#00B6F0", "#6366f1", "#f59e0b", "#10b981"];

function hasData(data: { value?: number }[], key: string) {
  return data.some((d) => Number((d as Record<string, number>)[key]) > 0);
}

export function AreaTrendChart({
  title,
  data,
  xKey,
  yKey,
  currency = false,
  color = PRIMARY,
}: {
  title: string;
  data: Record<string, number | string>[];
  xKey: string;
  yKey: string;
  currency?: boolean;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData(data as { value?: number }[], yKey) ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ left: -10, right: 10, top: 5 }}>
              <defs>
                <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(v) => (currency ? `₹${formatCompact(v)}` : String(v))}
              />
              <Tooltip
                formatter={(v) => (currency ? formatINR(Number(v)) : v)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(120,120,120,0.2)",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#grad-${yKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={LineIcon} title="No data yet" description="Data will appear once bookings start coming in." />
        )}
      </CardContent>
    </Card>
  );
}

export function BarRankChart({
  title,
  data,
  xKey,
  yKey,
  currency = false,
}: {
  title: string;
  data: Record<string, number | string>[];
  xKey: string;
  yKey: string;
  currency?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid horizontal={false} stroke="rgba(120,120,120,0.15)" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(v) => (currency ? `₹${formatCompact(v)}` : String(v))}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={120}
                tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 15) + "…" : v)}
              />
              <Tooltip
                formatter={(v) => (currency ? formatINR(Number(v)) : v)}
                cursor={{ fill: "rgba(120,120,120,0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(120,120,120,0.2)",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                }}
              />
              <Bar dataKey={yKey} radius={[0, 6, 6, 0]} barSize={22}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={LineIcon} title="No data yet" />
        )}
      </CardContent>
    </Card>
  );
}

export { PRIMARY, ACCENT };
