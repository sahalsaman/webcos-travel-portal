import { AiTabs } from "@/components/ai-tabs";

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl space-y-6"><header><p className="text-sm font-semibold text-primary">AI studio</p><div className='flex gap-4 mt-1'><h1 className="text-2xl font-bold">AI Assistance</h1><div><AiTabs /></div></div></header>{children}</div>;
}
