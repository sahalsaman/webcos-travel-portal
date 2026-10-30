import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";

export function DocsFrame({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 text-slate-900"><DocsHeader /><article className="mx-auto max-w-4xl px-5 py-12"><p className="text-sm font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><div className="mt-9 space-y-8 leading-7 text-slate-700">{children}</div></article></main>;
}

export function DocsHeader({ floating = false }: { floating?: boolean }) {
  return <header className={floating ? "absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-7 sm:pt-6" : "bg-slate-50 px-4 pt-4 sm:px-7 sm:pt-6"}>
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_50px_rgba(2,8,33,.14)] sm:px-6">
      <Link href="/docs" className="flex shrink-0 items-center gap-2.5 text-slate-950">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-violet-500 text-white shadow-sm"><Compass className="size-5" /></span>
        <span className="leading-tight"><span className="block text-base font-extrabold tracking-tight">Travel Portal</span><span className="block text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Agency platform</span></span>
      </Link>
      <nav aria-label="Documentation" className="order-3 flex w-full items-center justify-center gap-1 text-sm font-semibold text-slate-700 sm:order-2 sm:w-auto">
        <Link href="/docs" className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-blue-700">Guide</Link>
        <Link href="/docs/onboarding" className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-blue-700">Onboarding</Link>
        <Link href="/docs/developer" className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-blue-700">Developer</Link>
      </nav>
      <Link href="/login" className="order-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:brightness-110 sm:order-3 sm:px-5">Sign in <ArrowUpRight className="size-4" /></Link>
    </div>
  </header>;
}

export function DocCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-950">{title}</h2><div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">{children}</div></section>;
}

export function Steps({ items }: { items: string[] }) {
  return <ol className="space-y-3">{items.map((item, index) => <li key={item} className="flex gap-3 rounded-xl border bg-white p-4"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><span>{item}</span></li>)}</ol>;
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[.9em] text-slate-800">{children}</code>;
}
