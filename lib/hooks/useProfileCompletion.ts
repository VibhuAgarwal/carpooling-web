import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useProfileCompletion() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await fetch("/api/auth/profile-status");
        if (res.ok) {
          const data = await res.json();
          setIsComplete(data.isComplete);

          if (!data.isComplete) {
            router.replace("/auth/complete-profile");
          }
        }
      } catch (err) {
        console.error("Failed to check profile status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [status, router]);

  return { isComplete, loading };
}