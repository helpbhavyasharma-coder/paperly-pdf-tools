import { FormEvent, useEffect, useState } from "react";
import Home from "@paperly/page";
import ImageToPdf from "@paperly/image-to-pdf/page";
import MergePdf from "@paperly/merge-pdf/page";
import PdfUnlocker from "@paperly/pdf-unlocker/page";
import CompressPdf from "@paperly/compress-pdf/page";
import SplitPdf from "@paperly/split-pdf/page";
import About from "@paperly/about/page";
import Contact from "@paperly/contact/page";
import Blog from "@paperly/blog/page";
import ImageGuide from "@paperly/blog/image-to-pdf-guide/page";
import HeicGuide from "@paperly/blog/heic-to-pdf/page";
import QualityGuide from "@paperly/blog/pdf-quality-guide/page";
import { ToolBlogArticle } from "@paperly/components/ToolBlogArticle";
import { getToolPost } from "@paperly/blog/toolPosts";
import Privacy from "@paperly/privacy/page";
import Terms from "@paperly/terms/page";
import { SiteHeader } from "@paperly/components/SiteHeader";
import { SiteFooter } from "@paperly/components/SiteFooter";

const routes: Record<string, { title: string; component: () => React.JSX.Element }> = {
  "/": { title: "Paperly - Simple PDF Tools", component: Home },
  "/image-to-pdf": { title: "Image to PDF | Paperly", component: ImageToPdf },
  "/merge-pdf": { title: "Merge PDF | Paperly", component: MergePdf },
  "/pdf-unlocker": { title: "PDF Unlocker | Paperly", component: PdfUnlocker },
  "/compress-pdf": { title: "Compress PDF | Paperly", component: CompressPdf },
  "/split-pdf": { title: "Split PDF | Paperly", component: SplitPdf },
  "/about": { title: "About | Paperly", component: About },
  "/contact": { title: "Contact | Paperly", component: Contact },
  "/blog": { title: "Blog | Paperly", component: Blog },
  "/blog/image-to-pdf-guide": { title: "Image to PDF Guide | Paperly", component: ImageGuide },
  "/blog/heic-to-pdf": { title: "HEIC to PDF Guide | Paperly", component: HeicGuide },
  "/blog/pdf-quality-guide": { title: "PDF Quality Guide | Paperly", component: QualityGuide },
  "/privacy": { title: "Privacy | Paperly", component: Privacy },
  "/terms": { title: "Terms | Paperly", component: Terms },
};

function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login.php", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const body = await response.json().catch(() => ({ error: "Login failed." }));
    if (response.ok) window.location.href = "/admin";
    else { setError(body.error || "Login failed."); setBusy(false); }
  }

  return <main className="login-page"><SiteHeader/><section className="login-card"><p className="kicker">OWNER ACCESS</p><h1>Admin sign in</h1><p>Use the private Paperly admin credentials configured on your PHP server.</p><form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label>{error&&<div className="login-error" role="alert">{error}</div>}<button className="primary" disabled={busy}>{busy?"Signing in...":"Sign in"}</button></form><a href="/" className="back-home">Back to Paperly</a><p className="php-admin-note">Admin access uses a secure PHP session cookie.</p></section></main>;
}

function AdminDashboard() {
  const stats=[{label:"Live tools",value:"5"},{label:"Planned tools",value:"0"},{label:"Blog posts",value:"9"},{label:"File storage",value:"None"}];
  return <main><SiteHeader/><header className="admin-hero shell"><div><p className="kicker">OWNER DASHBOARD</p><h1>Paperly admin</h1><p>PHP session protected controls and the current product roadmap.</p></div><form action="/api/logout.php" method="post"><button className="logout-button">Sign out</button></form></header><section className="admin-stats shell">{stats.map((stat)=><article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section><section className="admin-panels shell"><article><span>TOOLS</span><h2>Live tools</h2><ul><li><b>Image to PDF</b><em>Live</em></li><li><b>Merge PDF</b><em>Live</em></li><li><b>PDF Unlocker</b><em>Live</em></li><li><b>Compress PDF</b><em>Live</em></li><li><b>Split PDF</b><em>Live</em></li></ul><a href="/">Open tools &rarr;</a></article><article><span>CONTENT</span><h2>Published guides</h2><ul><li><b>Five PDF tool guides</b><em>Live</em></li><li><b>Bhauu ecosystem stories</b><em>Live</em></li><li><b>Quanta Classes guide</b><em>Live</em></li></ul><a href="/blog">View all 9 guides &rarr;</a></article></section><SiteFooter/></main>;
}

function NotFound() {
  return <main><SiteHeader/><section className="php-not-found shell"><div><h1>Page not found.</h1><p>The page you requested does not exist.</p><a className="primary" href="/">Back to Paperly</a></div></section><SiteFooter/></main>;
}

export function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const admin = path === "/admin";
  const login = path === "/admin/login";
  const route = routes[path];
  const toolPost = path.startsWith("/blog/") ? getToolPost(path.slice(6)) : undefined;
  useEffect(() => { document.title = admin ? "Admin | Paperly" : login ? "Admin Login | Paperly" : toolPost ? `${toolPost.title} | Paperly` : route?.title || "Page not found | Paperly"; }, [admin, login, route, toolPost]);
  if (admin) return <AdminDashboard/>;
  if (login) return <AdminLogin/>;
  if (toolPost) return <ToolBlogArticle post={toolPost}/>;
  if (!route) return <NotFound/>;
  const Page = route.component;
  return <Page/>;
}
