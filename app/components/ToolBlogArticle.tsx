import type { ToolPost } from "../blog/toolPosts";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function ToolBlogArticle({ post }: { post: ToolPost }) {
  const jsonLd = { "@context":"https://schema.org", "@graph":[
    { "@type":"BlogPosting", headline:post.title, description:post.description, image:post.image, datePublished:post.publishedAt, dateModified:post.updatedAt, wordCount:post.wordCount, about:{"@type":post.entityType,name:post.entityName,url:post.entityUrl}, author:{"@type":"Organization",name:"Paperly"}, publisher:{"@type":"Organization",name:"Paperly"}, mainEntityOfPage:`/blog/${post.slug}` },
    { "@type":"FAQPage", mainEntity:post.faq.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}})) },
  ]};

  return <main><SiteHeader/><article className="article long-article shell">
    <a href="/blog" className="back-home">← All guides</a><p className="kicker">— {post.tag}</p><h1>{post.title}</h1>
    <div className="article-meta"><span>Updated August 16, 2026</span><span>{post.readMinutes} min read</span><span>{post.wordCount.toLocaleString()} words</span></div>
    <figure className="article-cover"><img src={post.image} alt={post.imageAlt}/></figure>
    <p className="article-intro">{post.intro}</p>
    <nav className="article-toc" aria-label="On this page"><strong>In this guide</strong><ol>{post.sections.map((section,index)=><li key={section.heading}><a href={`#section-${index+1}`}>{section.heading}</a></li>)}</ol></nav>
    <div className="article-body">{post.sections.map((section,index)=><section id={`section-${index+1}`} key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</section>)}
      <aside className="article-links" aria-label="Related websites"><span>RELATED LINKS</span><h2>Continue exploring</h2><div>{post.relatedLinks.map(link=><a key={link.href} href={link.href} target={link.external?"_blank":undefined} rel={link.external?"noopener noreferrer":undefined}>{link.label}<b aria-hidden="true">↗</b></a>)}</div></aside>
      <section className="article-faq"><h2>Frequently asked questions</h2>{post.faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    </div>
    <div className="article-cta"><div><small>BHAUU · THOUGHTFULLY BUILT</small><h2>Continue from here</h2></div><a href={post.toolPath} target={post.toolPath.startsWith("http")?"_blank":undefined} rel={post.toolPath.startsWith("http")?"noopener noreferrer":undefined}>{post.ctaLabel} →</a></div>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><SiteFooter/></main>;
}
