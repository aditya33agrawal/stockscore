import { redirect } from "next/navigation";

// The admin refresh console now lives under /admin/refresh.
export default function ProfileRefreshRedirect() {
  redirect("/admin/refresh");
}
