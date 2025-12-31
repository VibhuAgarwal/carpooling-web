import { redirect } from "next/navigation";

export default function RoleCallbackPage() {
  // Backward-compatible route: roles are no longer used.
  redirect("/dashboard");
}
