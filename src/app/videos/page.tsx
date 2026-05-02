import { redirect } from "next/navigation";

export default function VideosPage() {
  redirect("/info?tab=videos");
}
