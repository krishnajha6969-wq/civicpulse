import { redirect } from "next/navigation";

export default function AllIssuesRedirectPage() {
  redirect("/admin/issues");
}
