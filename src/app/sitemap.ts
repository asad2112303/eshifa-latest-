import type { MetadataRoute } from "next";
import { serviceOrder, servicePath } from "@/data/services";
import { absoluteUrl } from "@/lib/site-config";

/**
 * Generated from the route table and the service data, so a new service page
 * cannot be added without appearing here — the old hand-written sitemap.xml
 * had to be edited separately and silently drifted.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, freq: "weekly" },
    { path: "/services", priority: 0.9, freq: "monthly" },
    { path: "/doctors", priority: 0.8, freq: "monthly" },
    { path: "/labs", priority: 0.8, freq: "monthly" },
    { path: "/international", priority: 0.7, freq: "monthly" },
    { path: "/resources", priority: 0.6, freq: "yearly" },
    { path: "/partner", priority: 0.7, freq: "monthly" },
    { path: "/about", priority: 0.6, freq: "yearly" },
    { path: "/contact", priority: 0.6, freq: "yearly" },
  ];

  return [
    ...staticRoutes.map(({ path, priority, freq }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: freq,
      priority,
    })),
    ...serviceOrder.map((slug) => ({
      url: absoluteUrl(servicePath(slug)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
