import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Cloud,
  Compass,
  CreditCard,
  FileText,
  Globe2,
  Hotel,
  MessageCircleMore,
  PackageCheck,
  Plane,
  SearchCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { DocsHeader } from "@/app/docs/_components";

export const metadata: Metadata = {
  title: "Travel Portal | Agency Guide",
  description: "Explore how Travel Portal connects travel inventory, enquiries, bookings, payments, AI Assistance and daily agency operations.",
};

const challenges = [
  {
    number: "01",
    title: "Information everywhere",
    problem: "Package details, hotel rates and traveller information are scattered across files and messages.",
    solution: "Keep inventory, customer records and bookings in one agency workspace.",
  },
  {
    number: "02",
    title: "Manual follow-ups",
    problem: "Enquiries, quotations and payment updates are difficult to follow as the team grows.",
    solution: "Give each lead and booking a clear place in the journey.",
  },
  {
    number: "03",
    title: "Too much repeated work",
    problem: "Your team spends time rebuilding itineraries and preparing the same documents again and again.",
    solution: "Start with AI drafts and create consistent, branded documents.",
  },
];

const features = [
  { icon: PackageCheck, number: "01", title: "Inventory & packages", text: "Organise suppliers, destinations, hotels, room categories, activities, transport and trip packages.", benefit: "Build accurate offers from connected information." },
  { icon: SearchCheck, number: "02", title: "Leads & quotations", text: "Capture travel interests, prepare itineraries and turn enquiries into clear proposals.", benefit: "Follow every opportunity from the first conversation." },
  { icon: CalendarCheck2, number: "03", title: "Bookings & travellers", text: "Manage manual and online bookings, traveller details, dates, statuses and confirmations.", benefit: "Keep the team aligned on what happens next." },
  { icon: CreditCard, number: "04", title: "Payments & finance", text: "Connect Razorpay for verified online payments and track invoices, expenses and refunds.", benefit: "See the commercial side of each journey clearly." },
  { icon: FileText, number: "05", title: "Branded documents", text: "Choose quotation and booking PDF templates with your agency colours and business information.", benefit: "Share professional documents with less formatting work." },
  { icon: UsersRound, number: "06", title: "People & operations", text: "Bring employee tasks, HRM, visa tracking, reservations and support tickets into the workflow.", benefit: "Give each team member a place to do their work." },
  { icon: Globe2, number: "07", title: "Your own booking platform", text: "Use the portal APIs to build a customer website or mobile app with your agency brand.", benefit: "Connect direct bookings to the same operations platform." },
];

const journey = [
  { icon: MessageCircleMore, title: "Enquiry", detail: "Understand the traveller’s plans" },
  { icon: FileText, title: "Quotation", detail: "Share itinerary and pricing" },
  { icon: CreditCard, title: "Payment", detail: "Verify the transaction" },
  { icon: CalendarCheck2, title: "Booking", detail: "Confirm and prepare the trip" },
  { icon: Plane, title: "Journey", detail: "Support through travel and return" },
];

const flowInputs = [
  { icon: Hotel, title: "Travel inventory", detail: "Hotels, suppliers, activities and packages" },
  { icon: UsersRound, title: "Customers & team", detail: "Leads, travellers and employees" },
  { icon: Cloud, title: "Integrations", detail: "Media, messaging, payments and AI" },
];

const flowOutputs = [
  { icon: CalendarCheck2, title: "Bookings", detail: "Manual and online journeys" },
  { icon: WalletCards, title: "Finance", detail: "Payments, invoices and expenses" },
  { icon: CircleHelp, title: "Service", detail: "Documents, tickets and follow-up" },
];

export default function DocsLandingPage() {
  return <main className="min-h-screen bg-[#f6f8ff] text-slate-950">
    <section className="relative isolate mx-2 mt-2 overflow-hidden rounded-[28px] bg-[#03050e] text-white sm:mx-4 sm:mt-4 sm:rounded-[34px]">
      <div className="pointer-events-none absolute -left-44 top-10 size-[600px] rounded-full bg-blue-700/50 blur-[110px]" />
      <div className="pointer-events-none absolute -right-44 bottom-0 size-[450px] rounded-full bg-violet-700/25 blur-[110px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.08]" style={{ backgroundImage: "radial-gradient(circle at center, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      <DocsHeader floating />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-48 sm:px-10 sm:pt-44 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:pb-28 lg:pt-52">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-100"><Sparkles className="size-4" /> A smarter home for travel agencies</p>
          <h1 className="mt-7 max-w-3xl text-4xl font-medium leading-[1.06] tracking-[-.045em] sm:text-5xl lg:text-[clamp(3.2rem,5vw,5.3rem)]">Every journey starts with a <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-violet-300 bg-clip-text text-transparent">connected agency.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">Bring packages, enquiries, bookings, payments and your team into one travel platform. Spend less time switching tools and more time creating remarkable trips.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/docs/onboarding" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-violet-500 px-6 py-3 font-semibold text-white shadow-[0_12px_36px_rgba(37,99,235,.4)] transition hover:brightness-110">Start onboarding <ArrowUpRight className="size-5" /></Link>
            <Link href="#features" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-white/70 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Explore features <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><Check className="size-4 text-sky-300" /> Inventory to booking</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-sky-300" /> Branded documents</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-sky-300" /> AI assisted creation</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute -left-5 top-14 z-10 hidden rounded-xl border border-white/15 bg-[#111827]/90 px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-2"><Compass className="size-4 text-sky-300" /> One agency workspace</div>
          <div className="absolute -right-4 bottom-20 z-10 hidden rounded-xl border border-white/15 bg-[#111827]/90 px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-2"><Bot className="size-4 text-sky-300" /> AI Assistance</div>
          <div className="overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-b from-slate-600/80 to-slate-900 p-3 shadow-[0_36px_100px_rgba(0,0,0,.45)] sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-slate-700">
              <Image src="/travel-portal-hero.png" alt="Travel advisor discussing a journey with customers" fill priority className="object-cover object-[62%_center]" sizes="(max-width: 1024px) 90vw, 520px" />
            </div>
            <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-sky-200">Travel Portal</p><p className="mt-1 text-lg font-semibold">From enquiry to extraordinary</p></div><span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/30"><ArrowUpRight className="size-5" /></span></div>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Available integrations" className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-7 border-b border-slate-200 pb-12"><p className="max-w-[230px] text-sm font-semibold uppercase tracking-[.15em] text-slate-500">Connect the tools behind your travel business</p><div className="flex flex-wrap gap-3">{["Razorpay payments", "WhatsApp OTP", "Cloudinary media", "Gemini AI"].map(item => <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">{item}</span>)}</div></div>
    </section>

    <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 sm:pb-28">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1fr] lg:gap-16"><div><Eyebrow>Why Travel Portal</Eyebrow><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">A simpler way to run the business behind every trip.</h2></div><p className="self-end text-lg leading-8 text-slate-600">The portal joins the information your team needs from the first enquiry through booking and traveller support. Everyone can work from the same journey context.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">{challenges.map(item => <article key={item.number} className="group rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(17,35,78,.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(17,35,78,.1)]"><span className="text-sm font-bold text-blue-600">{item.number} / AGENCY CHALLENGE</span><h3 className="mt-7 text-2xl font-semibold tracking-tight">{item.title}</h3><p className="mt-3 min-h-24 text-sm leading-7 text-slate-600">{item.problem}</p><div className="mt-6 border-t border-slate-200 pt-5"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.13em] text-blue-700"><CheckCircle2 className="size-4" /> The solution</span><p className="mt-2 text-sm leading-7 text-slate-700">{item.solution}</p></div></article>)}</div>
    </section>

    <section className="relative overflow-hidden bg-[#061337] py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute -right-32 top-0 size-[460px] rounded-full bg-blue-600/25 blur-[100px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 sm:px-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-20">
        <div><p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[.15em] text-sky-300"><Sparkles className="size-4" /> Featured capability</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">Your next great trip starts with <span className="text-sky-300">AI Assistance.</span></h2><p className="mt-6 max-w-xl text-base leading-8 text-slate-300">Describe a destination, hotel or package. AI creates a structured first draft your team can edit, approve and save to inventory.</p><div className="mt-8 flex flex-wrap gap-2">{["Destinations", "Hotels", "Packages"].map(item => <span key={item} className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium">{item}</span>)}</div><p className="mt-8 inline-flex items-start gap-3 text-sm leading-7 text-sky-100"><CheckCircle2 className="mt-1 size-5 shrink-0 text-sky-300" />Your team checks rates, itineraries, inclusions and images before publishing.</p></div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur sm:p-6"><div className="rounded-[20px] bg-white p-5 text-slate-900 sm:p-7"><div className="flex items-center justify-between border-b border-slate-100 pb-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-violet-500 text-white"><Bot className="size-5" /></span><div><p className="font-bold">AI Assistance</p><p className="text-xs text-slate-500">Travel content studio</p></div></div><Sparkles className="size-5 text-blue-600" /></div><div className="mt-6 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Your idea</p><p className="mt-2 text-sm leading-7 text-slate-700">“Create a 5-day Kerala journey with nature, local experiences and a comfortable hotel.”</p></div><div className="mt-4 space-y-3">{["Destination and trip outline", "Day-by-day itinerary draft", "Hotel and package details"].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium"><span className="grid size-6 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span>{step}<Check className="ml-auto size-4 text-blue-600" /></div>)}</div><div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Review and edit before saving</div></div></div>
      </div>
    </section>

    <section id="features" className="mx-auto max-w-7xl scroll-mt-12 px-6 py-20 sm:px-10 sm:py-28"><div className="flex flex-wrap items-end justify-between gap-6"><div className="max-w-2xl"><Eyebrow>What is inside</Eyebrow><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">The tools your agency needs, working together.</h2></div><p className="max-w-sm text-base leading-7 text-slate-600">Start with the parts your team needs today and connect more of the journey as you grow.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{features.map(({ icon: Icon, number, title, text, benefit }) => <article key={number} className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(17,35,78,.04)]"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="size-6" /></span><span className="text-xs font-bold text-slate-400">/{number}</span></div><h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p><p className="mt-7 border-t border-slate-100 pt-5 text-sm font-semibold leading-6 text-blue-700">{benefit}</p></article>)}</div></section>

    <section className="bg-white py-20 sm:py-28"><div className="mx-auto max-w-7xl px-6 sm:px-10"><div className="grid gap-6 lg:grid-cols-[.85fr_1fr] lg:gap-16"><div><Eyebrow>Traveller journey</Eyebrow><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">From first question to journey complete.</h2></div><p className="self-end text-base leading-8 text-slate-600">The sales, operations and service teams can follow the same traveller as each step moves forward.</p></div><ol className="mt-12 grid gap-3 md:grid-cols-5">{journey.map(({ icon: Icon, title, detail }, index) => <li key={title} className="relative rounded-2xl border border-slate-200 bg-[#f6f8ff] p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700"><Icon className="size-5" /></span><span className="text-xs font-bold text-blue-600">0{index + 1}</span></div><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>{index < journey.length - 1 && <ChevronRight aria-hidden="true" className="absolute -right-4 top-1/2 z-10 hidden size-6 -translate-y-1/2 rounded-full bg-blue-600 p-1 text-white md:block" />}</li>)}</ol><div className="mt-6 rounded-xl bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-900"><strong>One continuous record:</strong> keep the enquiry, proposal, payment, booking and support details connected.</div></div></section>

    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28"><div className="max-w-3xl"><Eyebrow>How the portal connects</Eyebrow><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">One shared centre for every part of the agency.</h2><p className="mt-5 text-base leading-8 text-slate-600">Bring your inventory, people and integrations into the portal. The same information supports bookings, finance and traveller service.</p></div><div className="mt-12 rounded-[30px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-[0_24px_60px_rgba(26,58,129,.07)] sm:p-9"><div className="grid gap-3 md:grid-cols-3">{flowInputs.map(({ icon: Icon, title, detail }) => <FlowTile key={title} icon={Icon} title={title} detail={detail} />)}</div><div className="flex justify-center py-4 text-blue-600"><ArrowDown className="size-6" aria-hidden="true" /></div><div className="flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#0a2270] via-blue-700 to-blue-600 px-6 py-7 text-white shadow-xl shadow-blue-700/20"><span className="grid size-12 place-items-center rounded-xl bg-white/15"><Compass className="size-6" /></span><div><p className="text-xl font-bold">Travel Portal</p><p className="text-sm text-blue-100">Your agency’s connected workspace</p></div></div><div className="flex justify-center py-4 text-blue-600"><ArrowDown className="size-6" aria-hidden="true" /></div><div className="grid gap-3 md:grid-cols-3">{flowOutputs.map(({ icon: Icon, title, detail }) => <FlowTile key={title} icon={Icon} title={title} detail={detail} />)}</div></div></section>

    <section className="mx-2 mb-2 overflow-hidden rounded-[28px] bg-[#050c25] px-6 py-20 text-center text-white sm:mx-4 sm:mb-4 sm:rounded-[34px] sm:py-24"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.16em] text-sky-300">Your next step</p><h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">Give your team one better way to work.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">Set up the agency workspace, connect your integrations and prepare your first package. The guides are here whenever you need them.</p><div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/docs/onboarding" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-violet-500 px-6 py-3 font-semibold text-white">Open onboarding guide <ArrowUpRight className="size-4" /></Link><Link href="/docs/developer" className="inline-flex items-center gap-2 rounded-full border border-white/50 px-6 py-3 font-semibold text-white">Developer guide <ArrowRight className="size-4" /></Link></div></div></section>
  </main>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-700"><span className="size-2 rounded-full bg-blue-600" />{children}</p>;
}

function FlowTile({ icon: Icon, title, detail }: { icon: typeof Hotel; title: string; detail: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="size-5" /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p></div></div>;
}
