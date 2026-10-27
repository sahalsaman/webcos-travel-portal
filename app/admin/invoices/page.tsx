"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorState, Loading, Status } from "@/components/admin-page-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Invoice = {
  _id: string;
  month: string;
  plan: string;
  monthlyAmount: number;
  setupFee: number;
  carryForward: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
  paidAt?: string | null;
  business?: { name: string };
};

const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "—";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function SubscriptionInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setError("");
    try {
      const response = await fetch("/api/platform/subscription-invoices");
      const responseText = await response.text();
      const body = responseText ? JSON.parse(responseText) : {};

      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to load invoices");
      }

      setInvoices(Array.isArray(body.data) ? body.data : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load invoices");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          (status === "all" || invoice.status === status) &&
          (month === "all" || invoice.month === month) &&
          (invoice.business?.name || "").toLowerCase().includes(query.toLowerCase()),
      ),
    [invoices, status, month, query],
  );

  const update = async (id: string, nextStatus: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/platform/subscription-invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const responseText = await response.text();
      const body = responseText ? JSON.parse(responseText) : {};
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to update invoice");
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update invoice");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <Loading />;

  const months = [...new Set(invoices.map((invoice) => invoice.month))];

  return (
    <section>
      <header className="mb-6">
        <p className="text-sm font-medium text-primary">Billing</p>
        <h1 className="mt-1 text-3xl font-bold">Subscription invoices</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invoices are generated when this page is opened each month. Unpaid balances carry forward to the next invoice.
        </p>
      </header>

      {error && (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tenant"
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="all">All months</option>
          {months.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-250 text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Tenant</th>
                <th className="p-4">Month / plan</th>
                <th className="p-4">Amounts</th>
                <th className="p-4">Generated</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {visible.map((invoice) => (
                <tr key={invoice._id} className="border-b last:border-0">
                  <td className="p-4 font-semibold">{invoice.business?.name || "Tenant"}</td>
                  <td className="p-4"><p className="font-medium capitalize">{invoice.plan}</p><p className="text-xs text-muted-foreground">{invoice.month}</p></td>
                  <td className="p-4"><p>{money(invoice.totalAmount)}</p><p className="text-xs text-muted-foreground">Monthly {money(invoice.monthlyAmount)} · Setup {money(invoice.setupFee)} · Carry {money(invoice.carryForward)}</p></td>
                  <td className="p-4 text-muted-foreground">{date(invoice.generatedAt)}</td>
                  <td className="p-4 text-muted-foreground">{date(invoice.paidAt)}</td>
                  <td className="p-4"><Status value={invoice.status} /></td>
                  <td className="p-4 text-right">
                    {invoice.status !== "paid" && <Button size="sm" disabled={busy} onClick={() => void update(invoice._id, "paid")}>Mark paid</Button>}
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No invoices match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
