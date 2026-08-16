import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { toolPosts } from "./toolPosts";

export const metadata:Metadata={title:"Paperly & Bhauu Blog — PDF Tools, Software and Education",description:"Detailed guides about Paperly PDF tools, Bhauu software company, Bhavya Sharma's portfolio, Bhauu Edu and Quanta Classes.",alternates:{canonical:"/blog"}};

export default function Blog(){return <main><SiteHeader/><header className="page-hero shell"><p className="kicker">— PAPERLY JOURNAL · A BHAUU PROJECT</p><h1>Useful guides for files,<br/><em>building and learning.</em></h1><p>Detailed, practical writing about Paperly PDF tools and the people, products and education ideas across the Bhauu ecosystem.</p></header><section className="blog-grid shell">{toolPosts.map(post=><a href={`/blog/${post.slug}`} className="blog-card" key={post.slug}><img src={post.image} alt={post.imageAlt}/><span>{post.tag}</span><h2>{post.title}</h2><p>{post.description}</p><small>{post.wordCount.toLocaleString()} words · {post.readMinutes} min read</small><b>Read complete guide →</b></a>)}</section><SiteFooter/></main>}
