"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PARTNER_TYPES } from "@/lib/constants";

interface Profile {
  businessName: string;
  partnerType: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  logo?: string;
  bannerImage?: string;
  profileImage?: string;
}

export function ProfileForm({ profile, slug }: { profile: Profile; slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Profile>({
    businessName: profile.businessName ?? "",
    partnerType: profile.partnerType ?? "Travel Agency",
    bio: profile.bio ?? "",
    contactEmail: profile.contactEmail ?? "",
    contactPhone: profile.contactPhone ?? "",
    logo: profile.logo ?? "",
    bannerImage: profile.bannerImage ?? "",
    profileImage: profile.profileImage ?? "",
  });

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Business name</Label>
            <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Partner type</Label>
            <Select value={form.partnerType} onChange={(e) => set("partnerType", e.target.value)}>
              {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Public URL</Label>
            <Input value={`/p/${slug}`} disabled className="font-mono" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Bio</Label>
            <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} className="min-h-24" />
          </div>
          <div>
            <Label className="mb-1.5 block">Contact email</Label>
            <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Contact phone</Label>
            <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Branding (image URLs)</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5 block">Logo</Label>
            <Input value={form.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="mb-1.5 block">Profile image</Label>
            <Input value={form.profileImage} onChange={(e) => set("profileImage", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="mb-1.5 block">Banner image</Label>
            <Input value={form.bannerImage} onChange={(e) => set("bannerImage", e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="gradient" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Save profile
        </Button>
      </div>
    </form>
  );
}
