"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type PdfStatus = "ready" | "locked";
type PdfItem = {
  id: string;
  file: File;
  pages: number;
  status: PdfStatus;
  password?: string;
};

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const isPdf = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

async function inspectPdf(file: File, password?: string) {
  const pdfjs = await getPdfJs();
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    password,
  });
  const pdf = await task.promise;
  const pages = pdf.numPages;
  await task.destroy();
  return pages;
}

const isPasswordError = (reason: unknown) =>
  typeof reason === "object" &&
  reason !== null &&
  "name" in reason &&
  reason.name === "PasswordException";

export default function MergePdf() {
  const [files, setFiles] = useState<PdfItem[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(88);
  const [protectPdf, setProtectPdf] = useState(false);
  const [outputPassword, setOutputPassword] = useState("");
  const [confirmOutputPassword, setConfirmOutputPassword] = useState("");
  const [showOutputPassword, setShowOutputPassword] = useState(false);
  const [passwordItemId, setPasswordItemId] = useState<string | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
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
      setMessage(`Checking ${index + 1} of ${selected.length}: ${file.name}`);
      try {
        const pages = await inspectPdf(file);
        additions.push({
          id: crypto.randomUUID(),
          file,
          pages,
          status: "ready",
        });
      } catch (reason) {
        if (isPasswordError(reason)) {
          additions.push({
            id: crypto.randomUUID(),
            file,
            pages: 0,
            status: "locked",
          });
        } else {
          rejected.push(file.name);
        }
      }
    }

    if (additions.length) setFiles((current) => [...current, ...additions]);
    if (rejected.length) {
      setError(`${rejected.join(", ")} could not be opened and may be damaged.`);
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

    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
  }

  function openPasswordDialog(id: string) {
    setPasswordItemId(id);
    setInputPassword("");
    setPasswordError("");
  }

  function closePasswordDialog() {
    if (isUnlocking) return;
    setPasswordItemId(null);
    setInputPassword("");
    setPasswordError("");
  }

  async function submitPassword() {
    const item = files.find((file) => file.id === passwordItemId);
    if (!item || !inputPassword) {
      setPasswordError("Enter the PDF password.");
      return;
    }

    setIsUnlocking(true);
    setPasswordError("");
    try {
      const pages = await inspectPdf(item.file, inputPassword);
      setFiles((current) =>
        current.map((file) =>
          file.id === item.id
            ? { ...file, pages, status: "ready", password: inputPassword }
            : file,
        ),
      );
      closePasswordDialog();
    } catch (reason) {
      setPasswordError(
        isPasswordError(reason)
          ? "Incorrect password. Please try again."
          : "This PDF could not be opened.",
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  function forgotPassword() {
    window.location.href = "/pdf-unlocker";
  }

  async function mergeFiles() {
    if (files.length < 2 || isMerging) return;
    if (files.some((file) => file.status === "locked")) {
      setError("Enter the password for every locked PDF before merging.");
      return;
    }
    if (
      protectPdf &&
      !/^[\x20-\x7E]{4,32}$/.test(outputPassword)
    ) {
      setError("Use an output password with 4 to 32 English letters, numbers or symbols.");
      return;
    }
    if (protectPdf && outputPassword !== confirmOutputPassword) {
      setError("The two output passwords do not match.");
      return;
    }

    setIsMerging(true);
    setError("");

    try {
      const pdfjs = await getPdfJs();
      const { jsPDF } = await import("jspdf");
      let merged: InstanceType<typeof jsPDF> | null = null;
      let completedPages = 0;
      const totalPages = files.reduce((total, item) => total + item.pages, 0);
      const renderScale = 1.1 + ((quality - 60) / 40) * 1.1;

      for (const item of files) {
        const task = pdfjs.getDocument({
          data: new Uint8Array(await item.file.arrayBuffer()),
          password: item.password,
        });
        const source = await task.promise;

        for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
          completedPages += 1;
          setMessage(`Building page ${completedPages} of ${totalPages}...`);
          const page = await source.getPage(pageNumber);
          const original = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const pixelLimit = 12_000_000;
          const pixelScale = Math.min(
            1,
            Math.sqrt(pixelLimit / (viewport.width * viewport.height)),
          );
          canvas.width = Math.max(1, Math.round(viewport.width * pixelScale));
          canvas.height = Math.max(1, Math.round(viewport.height * pixelScale));
          const finalViewport = page.getViewport({
            scale: renderScale * pixelScale,
          });
          await page.render({ canvas, viewport: finalViewport }).promise;
          const image = canvas.toDataURL("image/jpeg", quality / 100);
          const pageFormat: [number, number] = [original.width, original.height];
          const orientation =
            original.width > original.height ? "landscape" : "portrait";

          if (!merged) {
            merged = new jsPDF({
              unit: "pt",
              format: pageFormat,
              orientation,
              compress: true,
              ...(protectPdf
                ? {
                    encryption: {
                      userPassword: outputPassword,
                      ownerPassword: crypto.randomUUID(),
                      userPermissions: ["print" as const],
                    },
                  }
                : {}),
            });
          } else {
            merged.addPage(pageFormat, orientation);
          }
          merged.addImage(
            image,
            "JPEG",
            0,
            0,
            original.width,
            original.height,
            undefined,
            "FAST",
          );
          page.cleanup();
          canvas.width = 1;
          canvas.height = 1;
        }
        await task.destroy();
      }

      if (!merged) throw new Error("No pages");
      setMessage("Preparing your download...");
      merged.save(`paperly-merged-${new Date().toISOString().slice(0, 10)}.pdf`);
      setMessage(
        protectPdf
          ? "Your password-protected merged PDF has been downloaded."
          : "Your merged PDF has been downloaded.",
      );
      window.setTimeout(() => setMessage(""), 3500);
    } catch {
      setMessage("");
      setError("We could not merge these files. Check the passwords and try again.");
    } finally {
      setIsMerging(false);
    }
  }

  const selectedPasswordFile = files.find(
    (file) => file.id === passwordItemId,
  );
  const totalPages = files.reduce((total, item) => total + item.pages, 0);
  const totalSize = files.reduce((total, item) => total + item.file.size, 0);
  const hasLockedFiles = files.some((file) => file.status === "locked");

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
        <input
          className="hidden-file-input"
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={chooseFiles}
        />
        {files.length === 0 && (
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
            <div className="merge-icon" aria-hidden="true">
              <span>PDF</span>
              <b>+</b>
              <span>PDF</span>
            </div>
            <h2>Drop your PDFs here</h2>
            <p>Locked and unlocked PDF files are supported</p>
            <button
              className="primary"
              onClick={() => inputRef.current?.click()}
              disabled={isReading || isMerging}
            >
              {isReading ? "Checking PDFs..." : "Choose PDF files"}
            </button>
            <small>No upload. No watermark. Completely free.</small>
          </div>
        )}

        {error && <div className="alert error" role="alert">{error}</div>}
        {message && <div className="alert" role="status">{message}</div>}

        {files.length > 0 && (
          <div className="merge-editor">
            <div className="title">
              <div><h2>Arrange your PDFs</h2></div>
              <button className="clear" onClick={clearFiles}>Clear all</button>
            </div>

            <div className="pdf-list">
              {files.map((item, index) => (
                <article
                  className={`pdf-row ${item.status === "locked" ? "locked" : ""}`}
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
                      {item.status === "locked"
                        ? "Locked PDF"
                        : `${item.pages} ${item.pages === 1 ? "page" : "pages"}`}
                      {" - "}{formatBytes(item.file.size)}
                    </span>
                  </div>
                  {item.status === "locked" && (
                    <button
                      className="unlock-pdf-button"
                      onClick={() => openPasswordDialog(item.id)}
                    >
                      Enter password
                    </button>
                  )}
                  <div className="pdf-actions">
                    <button onClick={() => moveFile(index, -1)} disabled={index === 0} aria-label="Move PDF up">&#8593;</button>
                    <button onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} aria-label="Move PDF down">&#8595;</button>
                    <button onClick={() => removeFile(item.id)} aria-label="Remove PDF">&#215;</button>
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

            <div className="merge-setting">
              <div className="title"><div><i>01</i><h2>PDF quality</h2></div></div>
              <label className="merge-quality">
                <span>Quality <b>{quality}%</b></span>
                <input type="range" min="60" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
              </label>
            </div>

            <div className="merge-setting">
              <div className="title"><div><i>02</i><h2>Password protect</h2></div></div>
              <div className={`security-card ${protectPdf ? "enabled" : ""}`}>
                <div className="security-intro">
                  <div>
                    <strong>Lock the merged PDF</strong>
                    <p>The finished PDF will ask for this password before it opens.</p>
                  </div>
                  <label className="security-switch">
                    <input
                      aria-label="Password protect the merged PDF"
                      type="checkbox"
                      checked={protectPdf}
                      onChange={(event) => {
                        setProtectPdf(event.target.checked);
                        setError("");
                        if (!event.target.checked) {
                          setOutputPassword("");
                          setConfirmOutputPassword("");
                          setShowOutputPassword(false);
                        }
                      }}
                    />
                    <span aria-hidden="true"></span>
                    <b>{protectPdf ? "On" : "Off"}</b>
                  </label>
                </div>
                {protectPdf && (
                  <div className="password-fields">
                    <label>
                      <span>Password</span>
                      <input type={showOutputPassword ? "text" : "password"} value={outputPassword} maxLength={32} autoComplete="new-password" placeholder="4-32 characters" onChange={(event) => setOutputPassword(event.target.value)} />
                    </label>
                    <label>
                      <span>Confirm password</span>
                      <input type={showOutputPassword ? "text" : "password"} value={confirmOutputPassword} maxLength={32} autoComplete="new-password" placeholder="Enter it again" onChange={(event) => setConfirmOutputPassword(event.target.value)} />
                    </label>
                    <label className="show-password">
                      <input type="checkbox" checked={showOutputPassword} onChange={(event) => setShowOutputPassword(event.target.checked)} />
                      Show password
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="convert merge-bar">
              <div>
                <strong>
                  {files.length} {files.length === 1 ? "file" : "files"} - {totalPages} {totalPages === 1 ? "page" : "pages"}
                </strong>
                <small>{formatBytes(totalSize)} selected</small>
              </div>
              <button
                className="primary"
                onClick={mergeFiles}
                disabled={files.length < 2 || isMerging || isReading || hasLockedFiles}
              >
                {isMerging
                  ? "Merging your PDFs..."
                  : hasLockedFiles
                    ? "Unlock PDFs to continue"
                    : files.length < 2
                      ? "Add one more PDF"
                      : protectPdf
                        ? "Merge & download locked PDF"
                        : "Merge & download PDF"}
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedPasswordFile && (
        <div className="password-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePasswordDialog(); }}>
          <div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
            <button className="modal-close" onClick={closePasswordDialog} aria-label="Close password dialog">&#215;</button>
            <small>LOCKED PDF</small>
            <h2 id="password-dialog-title">Enter password</h2>
            <p title={selectedPasswordFile.file.name}>{selectedPasswordFile.file.name}</p>
            <input
              autoFocus
              type="password"
              value={inputPassword}
              placeholder="PDF password"
              onChange={(event) => setInputPassword(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void submitPassword(); }}
            />
            {passwordError && <div className="password-modal-error" role="alert">{passwordError}</div>}
            <div className="password-modal-actions">
              <button onClick={forgotPassword}>Forgot password</button>
              <button className="primary" onClick={() => void submitPassword()} disabled={isUnlocking}>
                {isUnlocking ? "Checking..." : "Okay"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="trust shell">
        <article><i>01</i><h3>Locked PDFs detected</h3><p>Enter the correct password only when a selected PDF needs it.</p></article>
        <article><i>02</i><h3>Choose your quality</h3><p>Control the balance between page clarity and the final file size.</p></article>
        <article><i>03</i><h3>Files stay on your device</h3><p>Your PDFs and passwords are processed locally and are not uploaded.</p></article>
      </section>
      <SiteFooter />
    </main>
  );
}
