import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolBlogArticle } from "../../components/ToolBlogArticle";
import { getToolPost, toolPosts } from "../toolPosts";

export function generateStaticParams(){return toolPosts.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const post=getToolPost(slug);if(!post)return {};return {title:`${post.title} | Paperly`,description:post.description,alternates:{canonical:`/blog/${post.slug}`},openGraph:{type:"article",title:post.title,description:post.description,url:`/blog/${post.slug}`,images:["/og-tools.png"]},twitter:{card:"summary_large_image",title:post.title,description:post.description,images:["/og-tools.png"]}};}
export default async function ToolBlogPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const post=getToolPost(slug);if(!post)notFound();return <ToolBlogArticle post={post}/>;}
