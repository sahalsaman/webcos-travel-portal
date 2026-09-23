"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TravelerField = "name" | "email" | "mobile";
type FieldErrors = Partial<Record<TravelerField, string>>;

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label>
      {children} <span className="text-destructive">*</span>
    </Label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function firstServerError(errors: unknown) {
  if (!errors || typeof errors !== "object") return null;
  return Object.values(errors as Record<string, unknown>)
    .flat()
    .filter(Boolean)[0];
}

export function AddTravelerDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({ name: "", email: "", mobile: "" });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateForm() {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = "Enter traveler name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function resetForm() {
    setForm({ name: "", email: "", mobile: "" });
    setErrors({});
  }

  function close() {
    if (!loading) setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/travelers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(String(firstServerError(data.errors) || data.message || "Traveler save failed"));
      }
      toast.success(data.data?.created ? "Traveler added" : "Traveler updated");
      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="gradient" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add Traveler
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={close}
            aria-label="Close traveler form"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">Add traveler</h2>
                <p className="text-sm text-muted-foreground">Create or update a traveler contact</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <div className="space-y-1.5">
                  <RequiredLabel>Traveler name</RequiredLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    aria-invalid={Boolean(errors.name)}
                    className={errors.name ? "border-destructive" : undefined}
                  />
                  <FieldError message={errors.name} />
                </div>

                <div className="space-y-1.5">
                  <RequiredLabel>Email</RequiredLabel>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    aria-invalid={Boolean(errors.email)}
                    className={errors.email ? "border-destructive" : undefined}
                  />
                  <FieldError message={errors.email} />
                </div>

                <div className="space-y-1.5">
                  <RequiredLabel>Mobile</RequiredLabel>
                  <Input
                    value={form.mobile}
                    onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
                    placeholder="10 digit mobile"
                    required
                    maxLength={10}
                    minLength={10}
                    aria-invalid={Boolean(errors.mobile)}
                    className={errors.mobile ? "border-destructive" : undefined}
                  />
                  <FieldError message={errors.mobile} />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                <Button type="button" variant="outline" onClick={close} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save traveler
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
