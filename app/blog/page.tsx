import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { toolPosts } from "./toolPosts";

export const metadata: Metadata = {
  title: "PDF Guides and Practical Document Advice | Paperly",
  description: "Detailed, plain-language guides for converting images, merging, unlocking, compressing and splitting PDF files safely.",
  alternates: { canonical: "/blog" },
};

export default function Blog(){return <main><SiteHeader/><header className="page-hero shell"><p className="kicker">— PAPERLY JOURNAL</p><h1>Useful PDF guides,<br/><em>written for real work.</em></h1><p>Detailed, practical guidance for handling everyday documents with care—without jargon, pressure or hidden steps.</p></header><section className="blog-grid shell">{toolPosts.map(post=><a href={`/blog/${post.slug}`} className="blog-card" key={post.slug}><span>{post.tag}</span><h2>{post.title}</h2><p>{post.description}</p><small>{post.wordCount.toLocaleString()} words · {post.readMinutes} min read</small><b>Read complete guide →</b></a>)}</section><SiteFooter/></main>}
