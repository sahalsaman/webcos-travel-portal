"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuNotification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  meta?: { href?: string };
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setItems(payload.data.items);
        setUnreadCount(payload.data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function markRead(id: string) {
    const item = items.find((notification) => notification._id === id);
    if (!item || item.read) return;
    setItems((current) => current.map((notification) => notification._id === id ? { ...notification, read: true } : notification));
    setUnreadCount((count) => Math.max(0, count - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setItems((current) => current.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void loadNotifications();
        }}
        className="relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-[70] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-bold">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread` : "You’re all caught up"}</p>
            </div>
            {unreadCount ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void markAllRead()}>
                <CheckCheck className="size-4" /> Mark all read
              </Button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading</div>
            ) : items.length ? items.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => {
                  void markRead(notification._id);
                  if (notification.meta?.href) {
                    setOpen(false);
                    router.push(notification.meta.href);
                  }
                }}
                className={cn("block w-full border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-secondary/60", !notification.read && "bg-primary/5")}
              >
                <span className="flex items-start gap-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", notification.read ? "bg-transparent" : "bg-primary")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{notification.title}</span>
                    {notification.message ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{notification.message}</span> : null}
                    <span className="mt-1.5 block text-[11px] text-muted-foreground">{relativeTime(notification.createdAt)}</span>
                  </span>
                </span>
              </button>
            )) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
