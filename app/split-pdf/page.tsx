"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type Mode = "extract" | "ranges" | "every";
type PdfItem = { file: File; pages: number; password?: string; locked: boolean };
type SplitResult = { name: string; bytes: Uint8Array; pages: number[] };

const formatBytes = (bytes: number) =>
  bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
const isPdf = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);
const isPasswordError = (reason: unknown) =>
  typeof reason === "object" && reason !== null && "name" in reason && reason.name === "PasswordException";

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

async function inspectPdf(file: File, password?: string) {
  const pdfjs = await getPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password });
  const pdf = await task.promise;
  const pages = pdf.numPages;
  await task.destroy();
  return pages;
}

function parseToken(token: string, max: number) {
  const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) throw new Error(`"${token.trim()}" is not a valid page or range.`);
  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  if (start < 1 || end < start || end > max) throw new Error(`Use page numbers between 1 and ${max}.`);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function parseExtract(value: string, max: number) {
  if (!value.trim()) throw new Error("Enter the pages you want to extract.");
  return [...new Set(value.split(",").flatMap((token) => parseToken(token, max)))];
}

function parseRanges(value: string, max: number) {
  if (!value.trim()) throw new Error("Enter at least one range.");
  return value.split(",").map((token) => parseToken(token, max));
}

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

export default function SplitPdf() {
  const [item, setItem] = useState<PdfItem | null>(null);
  const [mode, setMode] = useState<Mode>("extract");
  const [pageInput, setPageInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [results, setResults] = useState<SplitResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function invalidate() {
    setResults([]);
    setMessage("");
  }

  async function loadFile(file: File) {
    if (!isPdf(file)) return setError("Please choose a PDF file.");
    setIsReading(true);
    setError("");
    setMessage(`Checking ${file.name}...`);
    invalidate();
    try {
      setItem({ file, pages: await inspectPdf(file), locked: false });
      setPageInput("");
    } catch (reason) {
      if (isPasswordError(reason)) {
        setItem({ file, pages: 0, locked: true });
        setPasswordOpen(true);
      } else {
        setItem(null);
        setError("This PDF could not be opened and may be damaged.");
      }
    } finally {
      setIsReading(false);
      setMessage("");
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = "";
  }

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = Array.from(event.dataTransfer.files).find(isPdf);
    if (file) void loadFile(file);
    else setError("Please drop a PDF file.");
  }

  async function submitPassword() {
    if (!item || !inputPassword) return setPasswordError("Enter the current PDF password.");
    setIsReading(true);
    setPasswordError("");
    try {
      const pages = await inspectPdf(item.file, inputPassword);
      setItem({ ...item, pages, password: inputPassword, locked: false });
      setPasswordOpen(false);
      setInputPassword("");
    } catch (reason) {
      setPasswordError(isPasswordError(reason) ? "Incorrect password. Please try again." : "This PDF could not be opened.");
    } finally {
      setIsReading(false);
    }
  }

  function togglePage(page: number) {
    if (!item || mode !== "extract") return;
    let selected: number[] = [];
    try { selected = pageInput.trim() ? parseExtract(pageInput, item.pages) : []; } catch { selected = []; }
    selected = selected.includes(page) ? selected.filter((value) => value !== page) : [...selected, page].sort((a, b) => a - b);
    setPageInput(selected.join(", "));
    invalidate();
  }

  async function makeCopiedPdf(pages: number[]) {
    if (!item) throw new Error("No file");
    if (!item.password) {
      try {
        const source = await PDFDocument.load(await item.file.arrayBuffer());
        const output = await PDFDocument.create();
        const copied = await output.copyPages(source, pages.map((page) => page - 1));
        copied.forEach((page) => output.addPage(page));
        return new Uint8Array(await output.save({ useObjectStreams: true }));
      } catch {
        // Permission-restricted PDFs that open without a password are rendered
        // below so the resulting split files are clean and unrestricted.
      }
    }

    const pdfjs = await getPdfJs();
    const { jsPDF } = await import("jspdf");
    const task = pdfjs.getDocument({ data: new Uint8Array(await item.file.arrayBuffer()), password: item.password });
    const source = await task.promise;
    let output: InstanceType<typeof jsPDF> | null = null;
    for (let index = 0; index < pages.length; index += 1) {
      setMessage(`Building selected page ${index + 1} of ${pages.length}...`);
      const page = await source.getPage(pages[index]);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const pixelScale = Math.min(1, Math.sqrt(12000000 / (viewport.width * viewport.height)));
      canvas.width = Math.max(1, Math.round(viewport.width * pixelScale));
      canvas.height = Math.max(1, Math.round(viewport.height * pixelScale));
      await page.render({ canvas, viewport: page.getViewport({ scale: 2 * pixelScale }) }).promise;
      const image = canvas.toDataURL("image/jpeg", 0.92);
      const format: [number, number] = [original.width, original.height];
      const orientation = original.width > original.height ? "landscape" : "portrait";
      if (!output) output = new jsPDF({ unit: "pt", format, orientation, compress: true });
      else output.addPage(format, orientation);
      output.addImage(image, "JPEG", 0, 0, original.width, original.height, undefined, "FAST");
      page.cleanup();
      canvas.width = 1;
      canvas.height = 1;
    }
    await task.destroy();
    if (!output) throw new Error("No pages");
    return new Uint8Array(output.output("arraybuffer"));
  }

  async function splitPdf() {
    if (!item || item.locked || isWorking) return;
    setIsWorking(true);
    setError("");
    setResults([]);
    try {
      let groups: number[][];
      if (mode === "extract") groups = [parseExtract(pageInput, item.pages)];
      else if (mode === "ranges") groups = parseRanges(pageInput, item.pages);
      else groups = Array.from({ length: item.pages }, (_, index) => [index + 1]);

      const stem = item.file.name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-");
      const next: SplitResult[] = [];
      for (let index = 0; index < groups.length; index += 1) {
        setMessage(`Creating PDF ${index + 1} of ${groups.length}...`);
        const pages = groups[index];
        const label = mode === "extract" ? "selected-pages" : pages.length === 1 ? `page-${pages[0]}` : `pages-${pages[0]}-${pages[pages.length - 1]}`;
        next.push({ name: `paperly-${stem}-${label}.pdf`, bytes: await makeCopiedPdf(pages), pages });
      }
      setResults(next);
      setMessage(`${next.length} ${next.length === 1 ? "PDF is" : "PDFs are"} ready to download.`);
    } catch (reason) {
      setMessage("");
      setError(reason instanceof Error ? reason.message : "We could not split this PDF.");
    } finally {
      setIsWorking(false);
    }
  }

  function downloadOne(result: SplitResult) {
    downloadBlob(new Blob([result.bytes as BlobPart], { type: "application/pdf" }), result.name);
  }

  function downloadSeparately() {
    results.forEach((result, index) => window.setTimeout(() => downloadOne(result), index * 250));
    setMessage("Your separate PDF downloads have started.");
  }

  async function downloadZip() {
    if (!results.length) return;
    setIsWorking(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      results.forEach((result) => zip.file(result.name, result.bytes));
      setMessage("Building your ZIP file...");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(blob, `paperly-split-pdfs-${new Date().toISOString().slice(0, 10)}.zip`);
      setMessage("Your ZIP file has been downloaded.");
    } catch {
      setError("We could not create the ZIP file. Download the PDFs separately instead.");
    } finally {
      setIsWorking(false);
    }
  }

  let selectedPages: number[] = [];
  if (item && mode === "extract") {
    try { selectedPages = pageInput.trim() ? parseExtract(pageInput, item.pages) : []; } catch { selectedPages = []; }
  }

  return <main>
    <SiteHeader />
    <header className="hero compact-tool-hero shell"><p className="kicker">SEPARATE PDF PAGES</p><h1>Split one PDF into<br/><em>exactly what you need.</em></h1><p>Extract selected pages, create custom ranges, or turn every page into its own PDF.</p></header>
    <section className="workspace shell split-workspace">
      <input className="hidden-file-input" ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={chooseFile}/>
      {!item&&<div className={`drop batch-drop ${isDragging?"over":""}`} onDragEnter={(event)=>{event.preventDefault();setIsDragging(true)}} onDragOver={(event)=>event.preventDefault()} onDragLeave={()=>setIsDragging(false)} onDrop={drop}><div className="tool-file-icon" aria-hidden="true"><span>PDF</span><b>&divide;</b></div><h2>Drop a PDF here</h2><p>Choose the PDF you want to split</p><button className="primary" onClick={()=>inputRef.current?.click()} disabled={isReading}>{isReading?"Checking PDF...":"Choose PDF file"}</button><small>Locked PDFs are supported with the correct password.</small></div>}
      {error&&<div className="alert error" role="alert">{error}</div>}{message&&<div className="alert" role="status">{message}</div>}
      {item&&<div className="split-editor">
        <div className={`split-source ${item.locked?"locked":""}`}><div className="pdf-file-icon">PDF</div><div className="pdf-details"><strong>{item.file.name}</strong><span>{item.locked?"Password required":`${item.pages} ${item.pages===1?"page":"pages"}`} - {formatBytes(item.file.size)}</span></div>{item.locked?<button className="unlock-pdf-button" onClick={()=>setPasswordOpen(true)}>Enter password</button>:<span className="ready-pill">READY</span>}<button className="clear" onClick={()=>{setItem(null);setResults([]);setError("");setMessage("")}}>Remove</button></div>
        {!item.locked&&<><section className="batch-step"><div className="title"><div><i>01</i><h2>Choose how to split</h2></div></div><div className="split-modes"><button className={mode==="extract"?"selected":""} onClick={()=>{setMode("extract");setPageInput("");invalidate()}}><strong>Extract pages</strong><small>Combine selected pages into one new PDF</small></button><button className={mode==="ranges"?"selected":""} onClick={()=>{setMode("ranges");setPageInput("");invalidate()}}><strong>Custom ranges</strong><small>Create one PDF for every range</small></button><button className={mode==="every"?"selected":""} onClick={()=>{setMode("every");setPageInput("");invalidate()}}><strong>Every page</strong><small>Turn each page into a separate PDF</small></button></div>{mode!=="every"&&<label className="page-range-input"><span>{mode==="extract"?"Pages to extract":"Page ranges"}</span><input value={pageInput} onChange={(event)=>{setPageInput(event.target.value);invalidate()}} placeholder={mode==="extract"?"Example: 1, 3, 5-8":"Example: 1-3, 4-6, 7-10"}/><small>Use page numbers from 1 to {item.pages}.</small></label>}<div className="page-overview">{Array.from({length:item.pages},(_,index)=>index+1).map((page)=><button className={selectedPages.includes(page)?"selected":""} key={page} onClick={()=>togglePage(page)} disabled={mode!=="extract"}><span>PAGE</span><b>{page}</b></button>)}</div></section>
        <section className="batch-step"><div className="title"><div><i>02</i><h2>Split & download</h2></div></div><div className="batch-action"><div><strong>{mode==="extract"?"One PDF with selected pages":mode==="ranges"?"One PDF per range":"One PDF per page"}</strong><p>Original page quality is retained for unlocked source PDFs.</p></div><button className="primary" onClick={()=>void splitPdf()} disabled={isWorking}>{isWorking?"Creating PDFs...":"Split PDF"}</button></div>{!!results.length&&<div className="split-results">{results.map((result)=><article key={result.name}><div><strong>{result.name}</strong><small>{result.pages.length} {result.pages.length===1?"page":"pages"} - {formatBytes(result.bytes.byteLength)}</small></div><button onClick={()=>downloadOne(result)}>Download</button></article>)}{results.length>1&&<div className="download-options batch-downloads"><button onClick={downloadSeparately} disabled={isWorking}><span>PDF</span><strong>Download separately</strong><small>Save each result as its own PDF</small></button><button onClick={()=>void downloadZip()} disabled={isWorking}><span>ZIP</span><strong>Download ZIP</strong><small>Save every result in one ZIP</small></button></div>}</div>}</section></>}
      </div>}
    </section>
    {passwordOpen&&item&&<div className="password-modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget&&!isReading)setPasswordOpen(false)}}><div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="split-password-title"><button className="modal-close" onClick={()=>setPasswordOpen(false)} aria-label="Close password dialog">&#215;</button><small>LOCKED PDF</small><h2 id="split-password-title">Enter password</h2><p>{item.file.name}</p><input autoFocus type="password" value={inputPassword} placeholder="Current PDF password" onChange={(event)=>setInputPassword(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter")void submitPassword()}}/>{passwordError&&<div className="password-modal-error" role="alert">{passwordError}</div>}<div className="password-modal-actions"><button onClick={()=>setPasswordOpen(false)}>Cancel</button><button className="primary" onClick={()=>void submitPassword()} disabled={isReading}>{isReading?"Checking...":"Okay"}</button></div></div></div>}
    <section className="trust shell"><article><i>01</i><h3>Three splitting modes</h3><p>Extract selected pages, define ranges, or separate every page.</p></article><article><i>02</i><h3>Flexible downloads</h3><p>Download each result separately or collect multiple files in a ZIP.</p></article><article><i>03</i><h3>Files stay local</h3><p>Your PDF and password are processed only on your device.</p></article></section>
    <SiteFooter />
  </main>;
}
