export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <a className="brand footer-paperly" href="/">
            <b>P</b>Paperly
          </a>
          <p>Simple PDF tools that respect your files and your time.</p>
          <div className="venture">
            <span>A VENTURE UNDER</span>
            <img src="/bhauu01.png" alt="Bhauu" />
          </div>
        </div>
        <div>
          <h3>Tools</h3>
          <a href="/image-to-pdf">Image to PDF</a>
          <a href="/merge-pdf">Merge PDF</a>
          <span>Compress PDF - Soon</span>
          <span>Split PDF - Soon</span>
        </div>
        <div>
          <h3>Resources</h3>
          <a href="/blog">Blog</a>
          <a href="/blog/image-to-pdf-guide">Image to PDF guide</a>
          <a href="/blog/heic-to-pdf">HEIC to PDF guide</a>
          <a href="/blog/pdf-quality-guide">PDF quality guide</a>
        </div>
        <div>
          <h3>Company</h3>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>
          &copy; {new Date().getFullYear()} Paperly · All rights reserved.
        </span>
        <span>Files stay on your device · A venture under Bhauu</span>
      </div>
    </footer>
  );
}
