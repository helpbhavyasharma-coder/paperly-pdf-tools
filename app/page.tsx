const tools = [
  { name: "Image to PDF", description: "Turn JPG, PNG, WebP, HEIC, GIF and other images into one polished PDF.", href: "/image-to-pdf", formats: "JPG · PNG · HEIC · WEBP", icon: "IMG", available: true },
  { name: "Merge PDF", description: "Combine multiple PDF files into one document.", formats: "COMING SOON", icon: "PDF", available: false },
  { name: "Compress PDF", description: "Make PDF files smaller while keeping them clear.", formats: "COMING SOON", icon: "↓", available: false },
  { name: "Split PDF", description: "Extract pages or divide a PDF into separate files.", formats: "COMING SOON", icon: "↗", available: false },
];

export default function Home() {
  return <main className="tools-home">
    <nav className="nav shell"><a className="brand" href="/"><b>P</b>Paperly</a><span>Free · Private · No sign-up</span></nav>
    <header className="tools-hero shell"><p className="kicker">— SIMPLE PDF TOOLS</p><h1>What would you like<br/>to do with your <em>PDF?</em></h1><p>Pick a tool and get it done in your browser. No account, no watermark, and no complicated steps.</p></header>
    <section className="tools-section shell" aria-labelledby="tools-title">
      <div className="tools-heading"><div><span>01</span><h2 id="tools-title">Choose a tool</h2></div><p>1 tool available</p></div>
      <div className="tool-cards">{tools.map(tool=>tool.available?
        <a className="tool-card active-tool" href={tool.href} key={tool.name}><div className="tool-icon">{tool.icon}</div><div className="tool-copy"><span className="available-pill">AVAILABLE NOW</span><h3>{tool.name}</h3><p>{tool.description}</p><small>{tool.formats}</small></div><span className="tool-arrow">→</span></a>:
        <article className="tool-card upcoming-tool" key={tool.name}><div className="tool-icon">{tool.icon}</div><div className="tool-copy"><span className="soon-pill">COMING SOON</span><h3>{tool.name}</h3><p>{tool.description}</p></div></article>
      )}</div>
    </section>
    <section className="home-note shell"><div><span>PRIVATE BY DEFAULT</span><h2>Your files stay on your device.</h2></div><p>Paperly processes supported files locally in your browser. Nothing is stored, and there is nothing to sign up for.</p></section>
    <footer className="shell"><a className="brand" href="/"><b>P</b>Paperly</a><p>Simple tools. Thoughtfully made.</p><span>© {new Date().getFullYear()} Paperly</span></footer>
  </main>
}
