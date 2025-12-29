"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const { data : session, status,  } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<"USER" | "RIDER">("USER");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
  router.replace(
    session?.user?.role === "RIDER"
      ? "/dashboard/rider"
      : "/dashboard/user"
  );
}

  }, [status, role, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google",{
      callbackUrl: `/auth/role-callback?role=${role}`,
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-50">
      {/* Left section */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-black text-white">
        <h1 className="text-4xl font-bold mb-4">CarPool</h1>
        <p className="text-lg text-gray-300">
          Share rides. Save costs. Travel smarter.
        </p>
        <p className="mt-6 text-sm text-gray-400">
          Trusted car pooling for daily and long-distance travel.
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to continue
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2.5 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-60"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <Image
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                  width={45}
                  height={45}
                />
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 mt-6 text-center">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
