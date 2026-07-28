import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { cookieName, verifyAdminSession } from "../lib/admin-auth";
export const metadata:Metadata={title:"Admin | Paperly",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
const stats=[{label:"Live tools",value:"5"},{label:"Planned tools",value:"0"},{label:"Blog posts",value:"3"},{label:"File storage",value:"None"}];
export default async function Admin(){const store=await cookies();if(!await verifyAdminSession(store.get(cookieName)?.value))redirect("/admin/login");return <main><SiteHeader/><header className="admin-hero shell"><div><p className="kicker">OWNER DASHBOARD</p><h1>Paperly admin</h1><p>Private controls and a clear view of what is currently published.</p></div><form action="/api/admin/logout" method="post"><button className="logout-button">Sign out</button></form></header><section className="admin-stats shell">{stats.map(s=><article key={s.label}><span>{s.label}</span><strong>{s.value}</strong></article>)}</section><section className="admin-panels shell"><article><span>TOOLS</span><h2>Product roadmap</h2><ul><li><b>Image to PDF</b><em>Live</em></li><li><b>Merge PDF</b><em>Live</em></li><li><b>PDF Unlocker</b><em>Live</em></li><li><b>Compress PDF</b><em>Live</em></li><li><b>Split PDF</b><em>Live</em></li></ul><a href="/compress-pdf">Open Compress PDF &rarr;</a></article><article><span>CONTENT</span><h2>Published guides</h2><ul><li><b>Image to PDF guide</b><em>Live</em></li><li><b>HEIC to PDF</b><em>Live</em></li><li><b>PDF quality guide</b><em>Live</em></li></ul><a href="/blog">View blog &rarr;</a></article></section><SiteFooter/></main>}
