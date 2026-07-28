import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

const tools = [
  {
    name: "Image to PDF",
    description:
      "Turn JPG, PNG, WebP, HEIC, GIF and other images into one polished PDF.",
    href: "/image-to-pdf",
    formats: "JPG · PNG · HEIC · WEBP",
    icon: "IMG",
    available: true,
  },
  {
    name: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    href: "/merge-pdf",
    formats: "MULTIPLE PDF FILES",
    icon: "PDF",
    available: true,
  },
  {
    name: "PDF Unlocker",
    description: "Remove a known password and download clean unlocked PDF copies.",
    href: "/pdf-unlocker",
    formats: "SINGLE OR MULTIPLE PDF FILES",
    icon: "OPEN",
    available: true,
  },
  {
    name: "Compress PDF",
    description: "Make PDF files smaller while keeping them clear.",
    icon: "ZIP",
    available: false,
  },
  {
    name: "Split PDF",
    description: "Extract pages or divide a PDF into separate files.",
    icon: "CUT",
    available: false,
  },
];

export default function Home() {
  return (
    <main className="tools-home">
      <SiteHeader />
      <header className="tools-hero shell">
        <p className="kicker">SIMPLE PDF TOOLS</p>
        <h1>
          What do you want to do with your <em>PDF?</em>
        </h1>
        <p>Choose a tool. No account, watermark, or complicated steps.</p>
      </header>
      <section
        className="tools-section shell"
        id="tools"
        aria-labelledby="tools-title"
      >
        <div className="tools-heading">
          <div>
            <span>01</span>
            <h2 id="tools-title">Choose a tool</h2>
          </div>
          <p>3 tools available</p>
        </div>
        <div className="tool-cards">
          {tools.map((tool) =>
            tool.available ? (
              <a
                className="tool-card active-tool"
                href={tool.href}
                key={tool.name}
              >
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-copy">
                  <span className="available-pill">AVAILABLE NOW</span>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <small>{tool.formats}</small>
                </div>
                <span className="tool-arrow">&rarr;</span>
              </a>
            ) : (
              <article className="tool-card upcoming-tool" key={tool.name}>
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-copy">
                  <span className="soon-pill">COMING SOON</span>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
              </article>
            ),
          )}
        </div>
      </section>
      <section className="home-note shell">
        <div>
          <span>FILES STAY LOCAL</span>
          <h2>Your files stay on your device.</h2>
        </div>
        <p>
          Paperly processes supported files locally in your browser. Nothing is
          stored, and there is nothing to sign up for.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
