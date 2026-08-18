import { Navbar, Footer } from "@/components/site/sections";

/**
 * Public website chrome.
 *
 * Lives in the (site) route group rather than the root layout so the admin
 * portal does not inherit the marketing navbar and footer. Route groups do not
 * affect URLs — /about is still /about.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
