"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type Status = "ready" | "locked";
type Level = "recommended" | "strong" | "maximum";
type PdfItem = { id: string; file: File; pages: number; status: Status; password?: string };
type Result = { bytes: Uint8Array; size: number };

const profiles: Record<Level, { title: string; copy: string; scale: number; quality: number }> = {
  recommended: { title: "Recommended", copy: "Clear pages with a useful size reduction.", scale: 1.75, quality: 0.82 },
  strong: { title: "Strong", copy: "Smaller files for email and everyday sharing.", scale: 1.35, quality: 0.67 },
  maximum: { title: "Maximum", copy: "Smallest files when size matters most.", scale: 1.05, quality: 0.5 },
};

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

const outputName = (name: string, index: number) => {
  const stem = name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-");
  return `paperly-compressed-${stem}-${index + 1}.pdf`;
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

export default function CompressPdf() {
  const [files, setFiles] = useState<PdfItem[]>([]);
  const [level, setLevel] = useState<Level>("recommended");
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordItemId, setPasswordItemId] = useState<string | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const results = useRef(new Map<string, Result>());
  const inputRef = useRef<HTMLInputElement>(null);

  function invalidate() {
    results.current.clear();
    setIsPrepared(false);
  }

  async function addFiles(selectedFiles: FileList | File[]) {
    const selected = Array.from(selectedFiles).filter(isPdf);
    if (!selected.length) return setError("Please choose one or more PDF files.");
    invalidate();
    setError("");
    setIsReading(true);
    const additions: PdfItem[] = [];
    const rejected: string[] = [];
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      setMessage(`Checking ${index + 1} of ${selected.length}: ${file.name}`);
      try {
        additions.push({ id: crypto.randomUUID(), file, pages: await inspectPdf(file), status: "ready" });
      } catch (reason) {
        if (isPasswordError(reason)) additions.push({ id: crypto.randomUUID(), file, pages: 0, status: "locked" });
        else rejected.push(file.name);
      }
    }
    if (additions.length) setFiles((current) => [...current, ...additions]);
    if (rejected.length) setError(`${rejected.join(", ")} could not be opened and may be damaged.`);
    setMessage("");
    setIsReading(false);
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files);
    event.target.value = "";
  }

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
  }

  function removeFile(id: string) {
    invalidate();
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  function clearFiles() {
    invalidate();
    setFiles([]);
    setError("");
    setMessage("");
  }

  function openPassword(id: string) {
    setPasswordItemId(id);
    setInputPassword("");
    setPasswordError("");
  }

  function closePassword() {
    if (isChecking) return;
    setPasswordItemId(null);
    setInputPassword("");
    setPasswordError("");
  }

  async function submitPassword() {
    const item = files.find((file) => file.id === passwordItemId);
    if (!item || !inputPassword) return setPasswordError("Enter the current PDF password.");
    setIsChecking(true);
    setPasswordError("");
    try {
      const pages = await inspectPdf(item.file, inputPassword);
      invalidate();
      setFiles((current) => current.map((file) =>
        file.id === item.id ? { ...file, pages, status: "ready", password: inputPassword } : file,
      ));
      closePassword();
    } catch (reason) {
      setPasswordError(isPasswordError(reason) ? "Incorrect password. Please try again." : "This PDF could not be opened.");
    } finally {
      setIsChecking(false);
    }
  }

  async function compressOne(item: PdfItem, fileIndex: number) {
    const pdfjs = await getPdfJs();
    const { jsPDF } = await import("jspdf");
    const profile = profiles[level];
    const task = pdfjs.getDocument({ data: new Uint8Array(await item.file.arrayBuffer()), password: item.password });
    const source = await task.promise;
    let output: InstanceType<typeof jsPDF> | null = null;
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      setMessage(`Compressing file ${fileIndex + 1} of ${files.length}, page ${pageNumber} of ${source.numPages}...`);
      const page = await source.getPage(pageNumber);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: profile.scale });
      const canvas = document.createElement("canvas");
      const pixelScale = Math.min(1, Math.sqrt(9000000 / (viewport.width * viewport.height)));
      canvas.width = Math.max(1, Math.round(viewport.width * pixelScale));
      canvas.height = Math.max(1, Math.round(viewport.height * pixelScale));
      await page.render({ canvas, viewport: page.getViewport({ scale: profile.scale * pixelScale }) }).promise;
      const image = canvas.toDataURL("image/jpeg", profile.quality);
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
    const bytes = new Uint8Array(output.output("arraybuffer"));
    return { bytes, size: bytes.byteLength };
  }

  async function compressAll() {
    if (!files.length || isWorking) return;
    if (files.some((item) => item.status === "locked")) return setError("Enter the password for every locked PDF first.");
    setIsWorking(true);
    setError("");
    results.current.clear();
    try {
      for (let index = 0; index < files.length; index += 1) {
        results.current.set(files[index].id, await compressOne(files[index], index));
      }
      setIsPrepared(true);
      const original = files.reduce((total, item) => total + item.file.size, 0);
      const compressed = Array.from(results.current.values()).reduce((total, item) => total + item.size, 0);
      setMessage(`Compression complete: ${formatBytes(original)} to ${formatBytes(compressed)}.`);
    } catch {
      results.current.clear();
      setIsPrepared(false);
      setMessage("");
      setError("One PDF could not be compressed. Check the file and try again.");
    } finally {
      setIsWorking(false);
    }
  }

  function downloadOne(item: PdfItem, index: number) {
    const result = results.current.get(item.id);
    if (!result) return;
    downloadBlob(new Blob([result.bytes as BlobPart], { type: "application/pdf" }), outputName(item.file.name, index));
  }

  function downloadSeparately() {
    files.forEach((item, index) => window.setTimeout(() => downloadOne(item, index), index * 250));
    setMessage("Your separate compressed PDF downloads have started.");
  }

  async function downloadZip() {
    if (!isPrepared) return;
    setIsWorking(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      files.forEach((item, index) => {
        const result = results.current.get(item.id);
        if (result) zip.file(outputName(item.file.name, index), result.bytes);
      });
      setMessage("Building your ZIP file...");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(blob, `paperly-compressed-pdfs-${new Date().toISOString().slice(0, 10)}.zip`);
      setMessage("Your ZIP file has been downloaded.");
    } catch {
      setError("We could not create the ZIP. Download the PDFs separately instead.");
    } finally {
      setIsWorking(false);
    }
  }

  const selectedPasswordFile = files.find((file) => file.id === passwordItemId);
  const lockedCount = files.filter((item) => item.status === "locked").length;

  return <main>
    <SiteHeader />
    <header className="hero compact-tool-hero shell"><p className="kicker">MAKE PDF FILES SMALLER</p><h1>Compress your PDFs,<br/><em>keep them clear.</em></h1><p>Choose your compression level and reduce multiple PDFs together. Everything stays on your device.</p></header>
    <section className="workspace shell batch-workspace">
      <input className="hidden-file-input" ref={inputRef} type="file" accept="application/pdf,.pdf" multiple onChange={chooseFiles}/>
      {!files.length && <div className={`drop batch-drop ${isDragging ? "over" : ""}`} onDragEnter={(event)=>{event.preventDefault();setIsDragging(true)}} onDragOver={(event)=>event.preventDefault()} onDragLeave={()=>setIsDragging(false)} onDrop={drop}>
        <div className="tool-file-icon" aria-hidden="true"><span>PDF</span><b>&darr;</b></div><h2>Drop your PDFs here</h2><p>Choose one or multiple PDF files</p><button className="primary" onClick={()=>inputRef.current?.click()} disabled={isReading}>{isReading?"Checking PDFs...":"Choose PDF files"}</button><small>No upload. No watermark. Completely free.</small>
      </div>}
      {error && <div className="alert error" role="alert">{error}</div>}{message && <div className="alert" role="status">{message}</div>}
      {!!files.length && <div className="batch-editor">
        <div className="title"><div><h2>Your PDFs</h2></div><button className="clear" onClick={clearFiles}>Clear all</button></div>
        <div className="batch-file-list">{files.map((item,index)=>{
          const result=results.current.get(item.id);
          const saved=result?Math.max(0,Math.round((1-result.size/item.file.size)*100)):0;
          return <article className={`batch-file ${item.status}`} key={item.id}><div className="pdf-order">{index+1}</div><div className="pdf-file-icon">PDF</div><div className="pdf-details"><strong title={item.file.name}>{item.file.name}</strong><span>{item.status==="locked"?"Password required":`${item.pages} ${item.pages===1?"page":"pages"}`} - {formatBytes(item.file.size)}{result?` to ${formatBytes(result.size)}${saved?` - ${saved}% smaller`:""}`:""}</span></div>{item.status==="locked"?<button className="unlock-pdf-button" onClick={()=>openPassword(item.id)}>Enter password</button>:result?<button className="single-download" onClick={()=>downloadOne(item,index)}>Download</button>:<span className="ready-pill">READY</span>}<button className="remove-unlock-file" onClick={()=>removeFile(item.id)} aria-label={`Remove ${item.file.name}`}>&#215;</button></article>
        })}</div>
        <button className="add-pdf-button" onClick={()=>inputRef.current?.click()} disabled={isReading||isWorking}>+ Add more PDFs</button>
        <section className="batch-step"><div className="title"><div><i>01</i><h2>Choose compression</h2></div></div><div className="compression-levels">{(Object.keys(profiles) as Level[]).map((key)=><button className={level===key?"selected":""} key={key} onClick={()=>{setLevel(key);invalidate()}}><span>{key==="recommended"?"01":key==="strong"?"02":"03"}</span><strong>{profiles[key].title}</strong><small>{profiles[key].copy}</small></button>)}</div></section>
        <section className="batch-step"><div className="title"><div><i>02</i><h2>Compress & download</h2></div></div><div className="batch-action"><div><strong>{lockedCount?`${lockedCount} ${lockedCount===1?"file needs":"files need"} a password`:`${files.length} ${files.length===1?"file is":"files are"} ready`}</strong><p>Selected level: {profiles[level].title}</p></div><button className="primary" onClick={()=>void compressAll()} disabled={lockedCount>0||isWorking}>{isWorking?"Compressing PDFs...":isPrepared?"Compress again":"Compress PDFs"}</button></div>{isPrepared&&<div className="download-options batch-downloads"><button onClick={downloadSeparately} disabled={isWorking}><span>PDF</span><strong>Download separately</strong><small>Save every compressed PDF individually</small></button><button onClick={()=>void downloadZip()} disabled={isWorking}><span>ZIP</span><strong>Download ZIP</strong><small>Save all compressed PDFs together</small></button></div>}</section>
      </div>}
    </section>
    {selectedPasswordFile&&<div className="password-modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)closePassword()}}><div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="compress-password-title"><button className="modal-close" onClick={closePassword} aria-label="Close password dialog">&#215;</button><small>LOCKED PDF</small><h2 id="compress-password-title">Enter password</h2><p>{selectedPasswordFile.file.name}</p><input autoFocus type="password" value={inputPassword} placeholder="Current PDF password" onChange={(event)=>setInputPassword(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter")void submitPassword()}}/>{passwordError&&<div className="password-modal-error" role="alert">{passwordError}</div>}<div className="password-modal-actions"><button onClick={closePassword}>Cancel</button><button className="primary" onClick={()=>void submitPassword()} disabled={isChecking}>{isChecking?"Checking...":"Okay"}</button></div></div></div>}
    <section className="trust shell"><article><i>01</i><h3>Three useful levels</h3><p>Choose a practical balance between clarity and file size.</p></article><article><i>02</i><h3>Batch downloads</h3><p>Download files separately or together in one ZIP.</p></article><article><i>03</i><h3>Private processing</h3><p>Your PDFs and passwords stay on your device.</p></article></section>
    <SiteFooter />
  </main>;
}
