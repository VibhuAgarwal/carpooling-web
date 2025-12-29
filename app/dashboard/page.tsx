"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkInProgress = useRef(false);

  useEffect(() => {
    // Prevent multiple concurrent checks
    if (checkInProgress.current) return;
    
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      checkInProgress.current = true;
      
      const checkProfileStatus = async () => {
        try {
          console.log("Checking profile status...");
          const res = await fetch("/api/auth/profile-status", {
            method: "GET",
            cache: "no-store",
          });

          if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
          }

          const data = await res.json();
          console.log("Profile Status Response:", data);

          if (data.isProfileComplete) {
            setProfileComplete(true);
          } else {
            console.log("Profile incomplete, redirecting...");
            router.replace("/auth/complete-profile");
            return;
          }
        } catch (err) {
          console.error("Error checking profile status:", err);
          router.replace("/auth/complete-profile");
        } finally {
          setLoading(false);
          checkInProgress.current = false;
        }
      };

      checkProfileStatus();
    }
  }, [status, session?.user?.email, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profileComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">
            Choose an option below to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer">
            <Link
              href="/"
              className="block"
            >
              <div className="mb-4">
                <div className="text-5xl mb-4">🚗</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Book a Ride
                </h2>
                <p className="text-gray-600">
                  Find and book available rides from other users in your area.
                </p>
              </div>
              <span className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
                Search Rides →
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer">
            <Link
              href="/ride/new"
              className="block"
            >
              <div className="mb-4">
                <div className="text-5xl mb-4">📍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Post a Ride
                </h2>
                <p className="text-gray-600">
                  Share your ride and earn by offering seats to other users.
                </p>
              </div>
              <span className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
                Post a Ride →
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Your Activity
          </h3>
          <div className="text-center text-gray-500 py-8">
            <p>No recent activity. Start booking or posting rides!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
