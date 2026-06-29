import { redirect } from "next/navigation";

// The "Bookmarks" feature was rebranded to "Watchlist". Preserve old links and
// any saved /bookmarks URLs by redirecting to the new route.
export default function BookmarksRedirect() {
  redirect("/watchlist");
}
