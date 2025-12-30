"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ChatPage({ params }: { params: { rideId: string } }) {
  const sp = useSearchParams();
  const withUserId = sp.get("with") || "";
  const header = useMemo(
    () => `Ride ${params.rideId}${withUserId ? ` • Chat with ${withUserId}` : ""}`,
    [params.rideId, withUserId]
  );

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; text: string }>>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">{header}</h1>
        <p className="mt-2 text-sm text-gray-700">
          Masked communication: do not share phone numbers. Use this chat or masked calls.
        </p>

        <div className="mt-6 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 text-sm text-gray-600">
            Chat is a UI stub right now (wire to your realtime backend when ready).
          </div>

          <div className="p-4 space-y-2 min-h-[240px]">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-900">
                  {m.text}
                </div>
              ))
            )}
          </div>

          <form
            className="p-4 border-t border-gray-100 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              setMessages((prev) => [{ id: `${Date.now()}`, text }, ...prev]);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
              placeholder="Type a message (no phone numbers)"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
