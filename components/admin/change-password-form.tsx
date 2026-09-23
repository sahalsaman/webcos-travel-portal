"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({ email }: { email?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Password update failed");
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:max-w-xl">
          {email ? (
            <div>
              <Label className="mb-1.5 block">Account email</Label>
              <Input value={email} disabled />
            </div>
          ) : null}
          <div>
            <Label className="mb-1.5 block">Current password <span className="text-destructive">*</span></Label>
            <Input type="password" value={form.currentPassword} onChange={(event) => set("currentPassword", event.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">New password <span className="text-destructive">*</span></Label>
            <Input type="password" value={form.newPassword} onChange={(event) => set("newPassword", event.target.value)} minLength={6} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Confirm password <span className="text-destructive">*</span></Label>
            <Input type="password" value={form.confirmPassword} onChange={(event) => set("confirmPassword", event.target.value)} minLength={6} required />
          </div>
          <div>
            <Button type="submit" variant="gradient" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
