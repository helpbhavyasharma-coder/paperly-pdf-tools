"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type UnlockStatus = "ready" | "locked";
type UnlockItem = {
  id: string;
  file: File;
  pages: number;
  status: UnlockStatus;
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

const outputName = (name: string, index?: number) => {
  const stem = name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-");
  return `paperly-unlocked-${stem}${index ? `-${index}` : ""}.pdf`;
};

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function PdfUnlocker() {
  const [files, setFiles] = useState<UnlockItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordItemId, setPasswordItemId] = useState<string | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const preparedFiles = useRef(new Map<string, Uint8Array>());

  function invalidatePrepared() {
    preparedFiles.current.clear();
    setIsPrepared(false);
  }

  async function addFiles(selectedFiles: FileList | File[]) {
    const selected = Array.from(selectedFiles).filter(isPdf);
    if (!selected.length) {
      setError("Please choose one or more PDF files.");
      return;
    }

    invalidatePrepared();
    setError("");
    setMessage("");
    setIsReading(true);
    const additions: UnlockItem[] = [];
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

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
  }

  function removeFile(id: string) {
    invalidatePrepared();
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  function clearFiles() {
    invalidatePrepared();
    setFiles([]);
    setError("");
    setMessage("");
  }

  function openPasswordDialog(id: string) {
    setPasswordItemId(id);
    setInputPassword("");
    setPasswordError("");
  }

  function closePasswordDialog() {
    if (isCheckingPassword) return;
    setPasswordItemId(null);
    setInputPassword("");
    setPasswordError("");
  }

  async function submitPassword() {
    const item = files.find((file) => file.id === passwordItemId);
    if (!item || !inputPassword) {
      setPasswordError("Enter the current PDF password.");
      return;
    }

    setIsCheckingPassword(true);
    setPasswordError("");
    try {
      const pages = await inspectPdf(item.file, inputPassword);
      invalidatePrepared();
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
      setIsCheckingPassword(false);
    }
  }

  async function createUnlockedCopy(
    item: UnlockItem,
    fileIndex: number,
    totalFiles: number,
  ) {
    const pdfjs = await getPdfJs();
    const { jsPDF } = await import("jspdf");
    const task = pdfjs.getDocument({
      data: new Uint8Array(await item.file.arrayBuffer()),
      password: item.password,
    });
    const source = await task.promise;
    let output: InstanceType<typeof jsPDF> | null = null;

    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      setMessage(
        `Preparing file ${fileIndex + 1} of ${totalFiles}, page ${pageNumber} of ${source.numPages}...`,
      );
      const page = await source.getPage(pageNumber);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const pixelLimit = 12_000_000;
      const pixelScale = Math.min(
        1,
        Math.sqrt(pixelLimit / (viewport.width * viewport.height)),
      );
      canvas.width = Math.max(1, Math.round(viewport.width * pixelScale));
      canvas.height = Math.max(1, Math.round(viewport.height * pixelScale));
      const finalViewport = page.getViewport({ scale: 2 * pixelScale });
      await page.render({ canvas, viewport: finalViewport }).promise;
      const image = canvas.toDataURL("image/jpeg", 0.92);
      const pageFormat: [number, number] = [original.width, original.height];
      const orientation =
        original.width > original.height ? "landscape" : "portrait";

      if (!output) {
        output = new jsPDF({
          unit: "pt",
          format: pageFormat,
          orientation,
          compress: true,
        });
      } else {
        output.addPage(pageFormat, orientation);
      }
      output.addImage(
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
    if (!output) throw new Error("No pages");
    return new Uint8Array(output.output("arraybuffer"));
  }

  async function prepareAll() {
    if (!files.length || isPreparing) return;
    if (files.some((item) => item.status === "locked")) {
      setError("Enter the correct password for every locked PDF first.");
      return;
    }

    setIsPreparing(true);
    setError("");
    preparedFiles.current.clear();
    try {
      for (let index = 0; index < files.length; index += 1) {
        const item = files[index];
        const bytes = await createUnlockedCopy(item, index, files.length);
        preparedFiles.current.set(item.id, bytes);
      }
      setIsPrepared(true);
      setMessage(`${files.length} unlocked ${files.length === 1 ? "PDF is" : "PDFs are"} ready to download.`);
    } catch {
      preparedFiles.current.clear();
      setIsPrepared(false);
      setMessage("");
      setError("We could not prepare one of these PDFs. Check the file and password, then try again.");
    } finally {
      setIsPreparing(false);
    }
  }

  function downloadOne(item: UnlockItem, index: number) {
    const bytes = preparedFiles.current.get(item.id);
    if (!bytes) return;
    downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outputName(item.file.name, index + 1));
  }

  function downloadSeparately() {
    if (!isPrepared) return;
    files.forEach((item, index) => {
      window.setTimeout(() => downloadOne(item, index), index * 250);
    });
    setMessage("Your separate PDF downloads have started.");
  }

  async function downloadZip() {
    if (!isPrepared) return;
    setIsPreparing(true);
    setError("");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      files.forEach((item, index) => {
        const bytes = preparedFiles.current.get(item.id);
        if (bytes) zip.file(outputName(item.file.name, index + 1), bytes);
      });
      setMessage("Building your ZIP file...");
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      downloadBlob(blob, `paperly-unlocked-pdfs-${new Date().toISOString().slice(0, 10)}.zip`);
      setMessage("Your ZIP file has been downloaded.");
      window.setTimeout(() => setMessage(""), 3500);
    } catch {
      setMessage("");
      setError("We could not create the ZIP file. Try downloading the PDFs separately.");
    } finally {
      setIsPreparing(false);
    }
  }

  const selectedPasswordFile = files.find(
    (file) => file.id === passwordItemId,
  );
  const lockedCount = files.filter((item) => item.status === "locked").length;
  const totalPages = files.reduce((total, item) => total + item.pages, 0);
  const totalSize = files.reduce((total, item) => total + item.file.size, 0);

  return (
    <main>
      <SiteHeader />
      <header className="hero unlocker-hero shell">
        <p className="kicker">REMOVE PDF PASSWORDS</p>
        <h1>
          Unlock your PDFs,
          <br />
          <em>keep them yours.</em>
        </h1>
        <p>
          Enter the current password once and download clean, unlocked copies.
          Your files and passwords stay on your device.
        </p>
      </header>

      <section className="workspace shell unlocker-workspace">
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
            className={`drop unlocker-drop ${isDraggingOver ? "over" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={drop}
          >
            <div className="unlocker-icon" aria-hidden="true">
              <span>PDF</span><b>&#8634;</b>
            </div>
            <h2>Drop your PDFs here</h2>
            <p>Choose one or multiple password-protected PDFs</p>
            <button
              className="primary"
              onClick={() => inputRef.current?.click()}
              disabled={isReading || isPreparing}
            >
              {isReading ? "Checking PDFs..." : "Choose PDF files"}
            </button>
            <small>The current password is required. Files never leave your device.</small>
          </div>
        )}

        {error && <div className="alert error" role="alert">{error}</div>}
        {message && <div className="alert" role="status">{message}</div>}

        {files.length > 0 && (
          <div className="unlocker-editor">
            <div className="title">
              <div><h2>Your PDFs</h2></div>
              <button className="clear" onClick={clearFiles}>Clear all</button>
            </div>
            <div className="unlocker-file-list">
              {files.map((item, index) => (
                <article className={`unlocker-file ${item.status}`} key={item.id}>
                  <div className="pdf-order">{index + 1}</div>
                  <div className="pdf-file-icon">PDF</div>
                  <div className="pdf-details">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <span>
                      {item.status === "locked"
                        ? "Password required"
                        : `${item.pages} ${item.pages === 1 ? "page" : "pages"} - Ready`}
                      {" - "}{formatBytes(item.file.size)}
                    </span>
                  </div>
                  {item.status === "locked" ? (
                    <button className="unlock-pdf-button" onClick={() => openPasswordDialog(item.id)}>
                      Enter password
                    </button>
                  ) : isPrepared ? (
                    <button className="single-download" onClick={() => downloadOne(item, index)}>
                      Download
                    </button>
                  ) : (
                    <span className="ready-pill">READY</span>
                  )}
                  <button className="remove-unlock-file" onClick={() => removeFile(item.id)} aria-label={`Remove ${item.file.name}`}>&#215;</button>
                </article>
              ))}
            </div>
            <button
              className="add-pdf-button"
              onClick={() => inputRef.current?.click()}
              disabled={isReading || isPreparing}
            >
              + Add more PDFs
            </button>

            <section className="unlock-step">
              <div className="title"><div><i>01</i><h2>Prepare unlocked copies</h2></div></div>
              <div className="unlock-process-card">
                <div>
                  <strong>
                    {lockedCount
                      ? `${lockedCount} ${lockedCount === 1 ? "file needs" : "files need"} a password`
                      : `${files.length} ${files.length === 1 ? "file is" : "files are"} ready`}
                  </strong>
                  <p>{totalPages} pages - {formatBytes(totalSize)} selected</p>
                </div>
                <button
                  className="primary"
                  onClick={() => void prepareAll()}
                  disabled={lockedCount > 0 || isPreparing}
                >
                  {isPreparing ? "Preparing unlocked PDFs..." : isPrepared ? "Prepare again" : "Prepare unlocked PDFs"}
                </button>
              </div>
            </section>

            <section className="unlock-step">
              <div className="title"><div><i>02</i><h2>Download your files</h2></div></div>
              <div className="download-options">
                <button onClick={downloadSeparately} disabled={!isPrepared || isPreparing}>
                  <span>PDF</span>
                  <strong>Download separately</strong>
                  <small>Save each unlocked PDF as its own file</small>
                </button>
                <button onClick={() => void downloadZip()} disabled={!isPrepared || isPreparing}>
                  <span>ZIP</span>
                  <strong>Download ZIP file</strong>
                  <small>Save all unlocked PDFs in one ZIP</small>
                </button>
              </div>
            </section>
          </div>
        )}
      </section>

      {selectedPasswordFile && (
        <div className="password-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePasswordDialog(); }}>
          <div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="unlocker-password-title">
            <button className="modal-close" onClick={closePasswordDialog} aria-label="Close password dialog">&#215;</button>
            <small>CURRENT PASSWORD</small>
            <h2 id="unlocker-password-title">Unlock this PDF</h2>
            <p title={selectedPasswordFile.file.name}>{selectedPasswordFile.file.name}</p>
            <input
              autoFocus
              type="password"
              value={inputPassword}
              placeholder="Enter current PDF password"
              onChange={(event) => setInputPassword(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void submitPassword(); }}
            />
            {passwordError && <div className="password-modal-error" role="alert">{passwordError}</div>}
            <div className="password-modal-actions">
              <button onClick={closePasswordDialog}>Cancel</button>
              <button className="primary" onClick={() => void submitPassword()} disabled={isCheckingPassword}>
                {isCheckingPassword ? "Checking..." : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="trust shell">
        <article><i>01</i><h3>Correct password required</h3><p>Paperly removes a known password; it does not crack or recover forgotten passwords.</p></article>
        <article><i>02</i><h3>Batch unlock and download</h3><p>Prepare several PDFs together, then save them separately or in one ZIP.</p></article>
        <article><i>03</i><h3>Private on your device</h3><p>Your PDFs and passwords are processed locally and are never uploaded.</p></article>
      </section>
      <SiteFooter />
    </main>
  );
}
