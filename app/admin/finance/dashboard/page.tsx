import { CircleDollarSign, FileClock, HandCoins, Landmark, ReceiptText, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getAdminFinanceSummary, listAdminExpenses, listAdminInvoices } from "@/lib/dashboard";
import { formatDate, formatINR } from "@/lib/utils";
import type { ExpenseDTO, InvoiceDTO } from "@/types";

export default async function FinanceDashboardPage() {
  const [finance, expenses, invoices] = await Promise.all([getAdminFinanceSummary(), listAdminExpenses() as Promise<ExpenseDTO[]>, listAdminInvoices() as Promise<InvoiceDTO[]>]);
  const expenseTotal = expenses.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0);
  const outstanding = invoices.filter((item) => !["paid", "cancelled"].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  const net = finance.totals.paidRevenue - expenseTotal;
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Finance Dashboard</h2><p className="text-sm text-muted-foreground">Financial position across revenue, expenses, and receivables.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><StatCard label="Paid Revenue" value={formatINR(finance.totals.paidRevenue)} icon={Wallet} /><StatCard label="Admin Earnings" value={formatINR(finance.totals.adminEarnings)} icon={Landmark} /><StatCard label="Partner Earnings" value={formatINR(finance.totals.partnerEarnings)} icon={HandCoins} /><StatCard label="Total Expenses" value={formatINR(expenseTotal)} icon={ReceiptText} /><StatCard label="Net Position" value={formatINR(net)} icon={CircleDollarSign} /><StatCard label="Outstanding Invoices" value={formatINR(outstanding)} icon={FileClock} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Recent expenses</CardTitle></CardHeader><CardContent className="space-y-2">{expenses.slice(0, 5).map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.category} · {formatDate(item.expenseDate)}</p></div><div className="text-right"><p className="font-semibold">{formatINR(item.amount)}</p><StatusBadge status={item.status} /></div></div>)}{!expenses.length ? <p className="text-sm text-muted-foreground">No expenses recorded.</p> : null}</CardContent></Card>
    <Card><CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader><CardContent className="space-y-2">{invoices.slice(0, 5).map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-medium">{item.customerName}</p><p className="text-xs text-muted-foreground">{item.invoiceNumber} · Due {formatDate(item.dueDate)}</p></div><div className="text-right"><p className="font-semibold">{formatINR(item.amount)}</p><StatusBadge status={item.status} /></div></div>)}{!invoices.length ? <p className="text-sm text-muted-foreground">No invoices created.</p> : null}</CardContent></Card></div>
  </div>;
}
