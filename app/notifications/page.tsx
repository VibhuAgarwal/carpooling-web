"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then(res => res.json())
      .then(data => Array.isArray(data) && setNotifications(data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Notifications</h1>

      {notifications.length === 0 && (
        <p className="text-gray-500">No notifications yet.</p>
      )}

      {notifications.map(n => (
        <div
          key={n.id}
          className={`border rounded p-3 ${
            n.isRead ? "bg-white" : "bg-blue-50"
          }`}
        >
          <p>{n.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(n.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
