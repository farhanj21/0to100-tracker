import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · 0–100" };

export default function LoginPage() {
  // Already signed in? No need to show the form.
  if (isAuthenticated()) redirect("/");

  return (
    <div className="py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
