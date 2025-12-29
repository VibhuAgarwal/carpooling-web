"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

function safeInternalPath(raw?: string | null) {
  if (!raw) return null;
  // If it's a full URL, only allow same-origin paths (we only accept "/...")
  if (raw.startsWith("/")) return raw;
  return null;
}

export default function ProfileStatusLoader({
  children,
  callbackUrl,
  incompleteRedirectTo = "/auth/complete-profile",
  unauthenticatedRedirectTo,
}: {
  children: React.ReactNode;
  callbackUrl?: string | null;
  incompleteRedirectTo?: string;
  unauthenticatedRedirectTo?: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pageStatus, setPageStatus] = useState<
    "loading" | "authenticated" | "redirect"
  >("loading");

  const safeCb = useMemo(() => safeInternalPath(callbackUrl), [callbackUrl]);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        if (unauthenticatedRedirectTo) {
          setPageStatus("redirect");
          router.replace(unauthenticatedRedirectTo);
          return;
        }
        setPageStatus("authenticated");
        return;
      }

      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch("/api/auth/profile-status", {
            method: "GET",
            cache: "no-store",
          });

          if (!res.ok) throw new Error(`API returned ${res.status}`);

          const data = await res.json();
          const isComplete = Boolean(
            data?.isProfileComplete ?? data?.profileComplete ?? data?.complete
          );

          if (isComplete) {
            setPageStatus("authenticated");
            return;
          }

          setPageStatus("redirect");
          const qs = safeCb ? `?callbackUrl=${encodeURIComponent(safeCb)}` : "";
          router.replace(`${incompleteRedirectTo}${qs}`);
        } catch {
          setPageStatus("redirect");
          const qs = safeCb ? `?callbackUrl=${encodeURIComponent(safeCb)}` : "";
          router.replace(`${incompleteRedirectTo}${qs}`);
        }
      }
    };

    checkProfileStatus();
  }, [
    status,
    session?.user?.email,
    router,
    safeCb,
    incompleteRedirectTo,
    unauthenticatedRedirectTo,
  ]);

  // Show loader while checking profile status
  if (pageStatus === "loading" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Verifying your profile
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Please wait while we verify your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If redirecting, show nothing (router.replace handles the redirect)
  if (pageStatus === "redirect") {
    return null;
  }

  // If authenticated and profile is complete, show children
  return <>{children}</>;
}
