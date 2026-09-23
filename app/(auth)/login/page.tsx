"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations";

function dashboardPath(role?: string) {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin" || role === "employee") return "/admin";
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      toast.error("Invalid email or password");
      setLoading(false);
      return;
    }
    toast.success("Welcome back!");
    const session = await getSession();
    router.push(callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : dashboardPath(session?.user?.role));
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Log in to manage trips, bookings and earnings.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
          <Input id="email" type="email" placeholder="you@email.com" required {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
          <Input id="password" type="password" placeholder="••••••••" required {...register("password")} />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Log in
        </Button>
      </form>


    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
