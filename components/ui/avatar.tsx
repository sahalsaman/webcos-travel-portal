import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

/** Avatar with graceful fallback to ui-avatars.com initials. */
export function Avatar({ src, name = "User", size = 40, className }: AvatarProps) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=0080FF&color=fff&bold=true`;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-muted",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src || fallback}
        alt={name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        unoptimized
      />
    </span>
  );
}
