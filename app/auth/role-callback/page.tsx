import { redirect } from "next/navigation";

export default function RoleCallbackPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = searchParams.role;

  if (role !== "USER" && role !== "RIDER") {
    redirect("/login");
  }

  // Store role temporarily in cookie
  redirect(`/api/auth/session?role=${role}`);
}
