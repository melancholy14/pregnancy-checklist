import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregnancy-checklist.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
    lastModified: new Date(a.updated ?? a.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/timeline`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/checklist`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/checklist/hospital-bag`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/checklist/partner-prep`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/checklist/pregnancy-prep`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/baby-fair`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/info`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/weight`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...articleUrls,
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
