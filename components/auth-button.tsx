"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthButton({ authed }: { authed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  if (!authed) {
    const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/login${next}`} aria-label="Log in">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Log in</span>
        </Link>
      </Button>
    );
  }

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      disabled={loading}
      aria-label="Log out"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Log out</span>
    </Button>
  );
}
