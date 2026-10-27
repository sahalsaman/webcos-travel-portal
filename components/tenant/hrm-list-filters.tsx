"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function HrmListFilters({ search="", status="", statuses, placeholder="Search records..." }: { search?:string; status?:string; statuses?:readonly string[]; placeholder?:string }) {
  const router=useRouter(); const pathname=usePathname(); const[pending,startTransition]=useTransition();
  function navigate(nextSearch:string,nextStatus:string){const params=new URLSearchParams();if(nextSearch.trim())params.set("search",nextSearch.trim());if(nextStatus)params.set("status",nextStatus);startTransition(()=>router.push(`${pathname}${params.size?`?${params}`:""}`));}
  return <form className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row" onSubmit={(event)=>{event.preventDefault();const form=new FormData(event.currentTarget);navigate(String(form.get("search")||""),String(form.get("status")||""))}}><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input name="search" defaultValue={search} placeholder={placeholder} className="pl-9"/></div>{statuses&&<Select name="status" value={status} onChange={(event)=>navigate(search,event.target.value)} className="sm:w-48"><option value="">All statuses</option>{statuses.map((item)=><option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}</Select>}<Button type="submit" variant="outline" disabled={pending}>{pending?<Loader2 className="animate-spin"/>:<Search/>}Search</Button>{(search||status)&&<Button type="button" variant="ghost" onClick={()=>navigate("","")}><X/>Clear</Button>}</form>;
}
