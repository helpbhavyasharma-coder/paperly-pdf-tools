"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type PdfItem = { id: string; file: File; pages: number };

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const isPdf = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

export default function MergePdf() {
  const [files, setFiles] = useState<PdfItem[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(selectedFiles: FileList | File[]) {
    const selected = Array.from(selectedFiles).filter(isPdf);
    if (!selected.length) {
      setError("Please choose one or more PDF files.");
      return;
    }

    setError("");
    setMessage("");
    setIsReading(true);
    const additions: PdfItem[] = [];
    const rejected: string[] = [];

    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      setMessage(`Reading ${index + 1} of ${selected.length}: ${file.name}`);
      try {
        const document = await PDFDocument.load(await file.arrayBuffer());
        additions.push({
          id: crypto.randomUUID(),
          file,
          pages: document.getPageCount(),
        });
      } catch {
        rejected.push(file.name);
      }
    }

    if (additions.length) setFiles((current) => [...current, ...additions]);
    if (rejected.length) {
      setError(
        `${rejected.join(", ")} could not be opened. It may be damaged or password protected.`,
      );
    }
    setMessage("");
    setIsReading(false);
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files);
    event.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  function clearFiles() {
    setFiles([]);
    setError("");
    setMessage("");
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function drop(event: DragEvent<HTMLElement>, targetId?: string) {
    event.preventDefault();
    setIsDraggingOver(false);

    if (draggedId && targetId && draggedId !== targetId) {
      setFiles((current) => {
        const from = current.findIndex((item) => item.id === draggedId);
        const to = current.findIndex((item) => item.id === targetId);
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setDraggedId(null);
      return;
    }

    if (event.dataTransfer.files.length) {
      void addFiles(event.dataTransfer.files);
    }
  }

  async function mergeFiles() {
    if (files.length < 2 || isMerging) return;
    setIsMerging(true);
    setError("");

    try {
      const merged = await PDFDocument.create();
      for (let index = 0; index < files.length; index += 1) {
        setMessage(`Merging file ${index + 1} of ${files.length}...`);
        const source = await PDFDocument.load(
          await files[index].file.arrayBuffer(),
        );
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }

      setMessage("Preparing your download...");
      const bytes = await merged.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `paperly-merged-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Your merged PDF has been downloaded.");
      window.setTimeout(() => setMessage(""), 3500);
    } catch {
      setMessage("");
      setError(
        "We could not merge these files. Remove any damaged or password-protected PDF and try again.",
      );
    } finally {
      setIsMerging(false);
    }
  }

  const totalPages = files.reduce((total, item) => total + item.pages, 0);
  const totalSize = files.reduce((total, item) => total + item.file.size, 0);

  return (
    <main>
      <SiteHeader />
      <header className="hero merge-hero shell">
        <p className="kicker">COMBINE PDF FILES</p>
        <h1>
          Bring your PDFs
          <br />
          <em>together.</em>
        </h1>
        <p>
          Add files, arrange their order, and download one combined PDF.
          Everything happens on your device.
        </p>
      </header>

      <section className="workspace shell merge-workspace">
        <div
          className={`drop merge-drop ${isDraggingOver ? "over" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(event) => drop(event)}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={chooseFiles}
          />
          <div className="merge-icon" aria-hidden="true">
            <span>PDF</span>
            <b>+</b>
            <span>PDF</span>
          </div>
          <h2>{files.length ? "Add more PDFs" : "Drop your PDFs here"}</h2>
          <p>Select two or more PDF files</p>
          <button
            className="primary"
            onClick={() => inputRef.current?.click()}
            disabled={isReading || isMerging}
          >
            {isReading ? "Reading PDFs..." : "Choose PDF files"}
          </button>
          <small>No upload. No watermark. Completely free.</small>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="alert" role="status">
            {message}
          </div>
        )}

        {files.length > 0 && (
          <div className="merge-editor">
            <div className="title">
              <div>
                <i>01</i>
                <h2>Arrange your PDFs</h2>
              </div>
              <button className="clear" onClick={clearFiles}>
                Clear all
              </button>
            </div>

            <div className="pdf-list">
              {files.map((item, index) => (
                <article
                  className="pdf-row"
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => drop(event, item.id)}
                >
                  <div className="pdf-order">{index + 1}</div>
                  <div className="pdf-file-icon">PDF</div>
                  <div className="pdf-details">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <span>
                      {item.pages} {item.pages === 1 ? "page" : "pages"} ·{" "}
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                  <div className="pdf-actions">
                    <button
                      onClick={() => moveFile(index, -1)}
                      disabled={index === 0}
                      aria-label="Move PDF up"
                    >
                      &#8593;
                    </button>
                    <button
                      onClick={() => moveFile(index, 1)}
                      disabled={index === files.length - 1}
                      aria-label="Move PDF down"
                    >
                      &#8595;
                    </button>
                    <button
                      onClick={() => removeFile(item.id)}
                      aria-label="Remove PDF"
                    >
                      &#215;
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <button
              className="add-pdf-button"
              onClick={() => inputRef.current?.click()}
              disabled={isReading || isMerging}
            >
              + Add more PDFs
            </button>

            <div className="convert merge-bar">
              <div>
                <strong>
                  {files.length} {files.length === 1 ? "file" : "files"} ·{" "}
                  {totalPages} {totalPages === 1 ? "page" : "pages"}
                </strong>
                <small>{formatBytes(totalSize)} selected</small>
              </div>
              <button
                className="primary"
                onClick={mergeFiles}
                disabled={files.length < 2 || isMerging || isReading}
              >
                {isMerging
                  ? "Merging your PDFs..."
                  : files.length < 2
                    ? "Add one more PDF"
                    : "Merge & download PDF"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="trust shell">
        <article>
          <i>01</i>
          <h3>Order stays in your hands</h3>
          <p>Drag files or use the arrow controls to set the exact page order.</p>
        </article>
        <article>
          <i>02</i>
          <h3>Original quality retained</h3>
          <p>Pages are copied into the merged document without recompression.</p>
        </article>
        <article>
          <i>03</i>
          <h3>Files stay on your device</h3>
          <p>Your PDFs are processed locally and are not uploaded.</p>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
