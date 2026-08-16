import type { MetadataRoute } from "next";
import { toolPosts } from "./blog/toolPosts";

export default function sitemap():MetadataRoute.Sitemap{
  const base=process.env.NEXT_PUBLIC_SITE_URL||"https://paperly-image-pdf.bbdesktop01.chatgpt.site";
  const updated=new Date("2026-08-16T00:00:00+05:30");
  const routes=["/","/image-to-pdf","/merge-pdf","/pdf-unlocker","/compress-pdf","/split-pdf","/blog","/about","/contact","/privacy","/terms"];
  return [...routes.map((path)=>({url:`${base}${path}`,lastModified:updated,changeFrequency:"monthly" as const,priority:path==="/"?1:.8})),...toolPosts.map((post)=>({url:`${base}/blog/${post.slug}`,lastModified:updated,changeFrequency:"monthly" as const,priority:.7}))];
}
