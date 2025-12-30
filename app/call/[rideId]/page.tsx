"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function CallPage({ params }: { params: { rideId: string } }) {
  const sp = useSearchParams();
  const withUserId = sp.get("with") || "";
  const [status, setStatus] = useState<string>("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">Masked call</h1>
        <p className="mt-2 text-sm text-gray-700">
          Phone numbers are not shared. Calls are routed via a masking provider.
        </p>

        <div className="mt-6 rounded-2xl bg-white shadow-lg border border-gray-100 p-5">
          <div className="text-sm text-gray-600">
            Ride: <span className="font-mono">{params.rideId}</span>
            {withUserId ? (
              <>
                {" "}
                • With: <span className="font-mono">{withUserId}</span>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700"
            onClick={async () => {
              setStatus("Starting…");
              const res = await fetch("/api/calls/masked", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rideId: params.rideId, withUserId }),
              });

              if (res.ok) {
                setStatus("Call session created.");
                return;
              }

              const text = await res.text();
              setStatus(text || `Failed (${res.status})`);
            }}
          >
            Start masked call
          </button>

          {status ? <div className="mt-3 text-xs text-gray-600">{status}</div> : null}
        </div>
      </div>
    </div>
  );
}
