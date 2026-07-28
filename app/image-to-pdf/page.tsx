"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type Item={id:string;file:File;url:string;rotation:number};
type Size="a4"|"letter"|"auto";
const sizes={a4:[210,297],letter:[215.9,279.4]} as const;
const bytes=(n:number)=>n<1048576?`${Math.round(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`;
const heic=(f:File)=>/\.(heic|heif)$/i.test(f.name)||/image\/hei[cf]/.test(f.type);

async function source(file:File){
  if(!heic(file)) return URL.createObjectURL(file);
  const {default:convert}=await import("heic2any");
  const result=await convert({blob:file,toType:"image/jpeg",quality:.94});
  return URL.createObjectURL(Array.isArray(result)?result[0]:result);
}
function decode(url:string){return new Promise<HTMLImageElement>((ok,no)=>{const img=new Image();img.onload=()=>ok(img);img.onerror=no;img.src=url})}

export default function Home(){
  const [items,setItems]=useState<Item[]>([]);
  const [size,setSize]=useState<Size>("a4");
  const [orientation,setOrientation]=useState("auto");
  const [margin,setMargin]=useState(6);
  const [quality,setQuality]=useState(88);
  const [protectPdf,setProtectPdf]=useState(false);
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [drag,setDrag]=useState<string|null>(null);
  const [over,setOver]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const input=useRef<HTMLInputElement>(null);

  async function add(files:FileList|File[]){
    const valid=Array.from(files).filter(f=>f.type.startsWith("image/")||heic(f));
    if(!valid.length){setError("Please choose an image file such as JPG, PNG, WebP, GIF or HEIC.");return}
    setError("");setMessage(valid.some(heic)?"Preparing HEIC image...":"");
    try{const next=await Promise.all(valid.map(async file=>({id:crypto.randomUUID(),file,url:await source(file),rotation:0})));setItems(v=>[...v,...next]);setMessage("")}
    catch{setError("One image could not be opened. Try saving it as JPG or PNG.");setMessage("")}
  }
  function choose(e:ChangeEvent<HTMLInputElement>){if(e.target.files)void add(e.target.files);e.target.value=""}
  function remove(id:string){setItems(v=>{const x=v.find(i=>i.id===id);if(x)URL.revokeObjectURL(x.url);return v.filter(i=>i.id!==id)})}
  function clear(){items.forEach(i=>URL.revokeObjectURL(i.url));setItems([]);setError("");setMessage("")}
  function rotate(id:string){setItems(v=>v.map(i=>i.id===id?{...i,rotation:(i.rotation+90)%360}:i))}
  function move(index:number,by:number){setItems(v=>{const to=index+by;if(to<0||to>=v.length)return v;const n=[...v];[n[index],n[to]]=[n[to],n[index]];return n})}
  function drop(e:DragEvent<HTMLElement>,target?:string){e.preventDefault();setOver(false);if(drag&&target&&drag!==target){setItems(v=>{const a=v.findIndex(i=>i.id===drag),b=v.findIndex(i=>i.id===target),n=[...v];const [x]=n.splice(a,1);n.splice(b,0,x);return n});setDrag(null)}else if(e.dataTransfer.files.length)void add(e.dataTransfer.files)}

  async function makePdf(){
    if(!items.length||busy)return;
    if(protectPdf&&!/^[\x20-\x7E]{4,32}$/.test(password)){setError("Use a password with 4 to 32 English letters, numbers or symbols.");return}
    if(protectPdf&&password!==confirmPassword){setError("The two passwords do not match.");return}
    setBusy(true);setError("");
    try{
      const {jsPDF}=await import("jspdf");let pdf:InstanceType<typeof jsPDF>|null=null;
      for(let p=0;p<items.length;p++){
        setMessage(`Building page ${p+1} of ${items.length}...`);const item=items[p],img=await decode(item.url),side=item.rotation%180!==0;
        const sw=side?img.naturalHeight:img.naturalWidth,sh=side?img.naturalWidth:img.naturalHeight;
        let page:[number,number]=size==="auto"?[Math.max(25,sw*.15),Math.max(25,sh*.15)]:[...sizes[size]];
        const landscape=orientation==="landscape"||(orientation==="auto"&&sw>=sh);if((landscape&&page[0]<page[1])||(!landscape&&page[0]>page[1]))page=[page[1],page[0]];
        const canvas=document.createElement("canvas"),scale=Math.min(1,Math.sqrt(12000000/(sw*sh)));canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
        const ctx=canvas.getContext("2d");if(!ctx)throw Error();ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(item.rotation*Math.PI/180);
        const dw=side?canvas.height:canvas.width,dh=side?canvas.width:canvas.height;ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
        const fit=Math.min((page[0]-margin*2)/sw,(page[1]-margin*2)/sh),w=sw*fit,h=sh*fit,data=canvas.toDataURL("image/jpeg",quality/100),dir=page[0]>page[1]?"landscape":"portrait";
        if(!pdf)pdf=new jsPDF({
          unit:"mm",
          format:page,
          orientation:dir,
          compress:true,
          ...(protectPdf?{encryption:{
            userPassword:password,
            ownerPassword:crypto.randomUUID(),
            userPermissions:["print" as const]
          }}:{})
        });else pdf.addPage(page,dir);pdf.addImage(data,"JPEG",(page[0]-w)/2,(page[1]-h)/2,w,h,undefined,"FAST");
      }
      if(!pdf)throw Error();pdf.save(`paperly-${new Date().toISOString().slice(0,10)}.pdf`);setMessage(protectPdf?"Your password-protected PDF has been downloaded.":"Your PDF has been downloaded.");setTimeout(()=>setMessage(""),3500)
    }catch{setError("We could not create this PDF. Remove the last image and try again.");setMessage("")}finally{setBusy(false)}
  }

  return <main>
    <SiteHeader/>
    <header className="hero shell"><p className="kicker">- YOUR IMAGES, ONE TIDY PDF</p><h1>Turn any image into a<br/><em>beautiful PDF.</em></h1><p>Drop your photos, arrange the pages, and download. Everything happens in your browser - your images never leave your device.</p></header>
    <section className="workspace shell">
      <input className="hidden-file-input" ref={input} type="file" accept="image/*,.heic,.heif" multiple onChange={choose}/>
      {!items.length&&<div className={`drop ${over?"over":""}`} onDragEnter={e=>{e.preventDefault();setOver(true)}} onDragOver={e=>e.preventDefault()} onDragLeave={()=>setOver(false)} onDrop={e=>drop(e)}>
        <div className="fileicon" aria-hidden="true"><span className="upload-arrow"></span></div><h2>Drop your images here</h2><p>JPG, PNG, WebP, HEIC, GIF and more</p><button className="primary" onClick={()=>input.current?.click()}>Choose images</button><small>No sign-up. No watermarks. Completely free.</small>
      </div>}
      {error&&<div className="alert error">{error}</div>}{message&&<div className="alert">{message}</div>}
      {!!items.length&&<div className="editor">
        <div className="title"><div><i>01</i><h2>Arrange your pages</h2></div><button className="clear" onClick={clear}>Clear all</button></div>
        <div className="grid">{items.map((item,index)=><article key={item.id} draggable onDragStart={()=>setDrag(item.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,item.id)}>
          <div className="preview"><label>{index+1}</label><img src={item.url} alt={item.file.name} style={{transform:`rotate(${item.rotation}deg)`}}/><div className="actions"><button disabled={!index} onClick={()=>move(index,-1)} aria-label="Move left">&#8592;</button><button onClick={()=>rotate(item.id)} aria-label="Rotate">&#8635;</button><button disabled={index===items.length-1} onClick={()=>move(index,1)} aria-label="Move right">&#8594;</button><button onClick={()=>remove(item.id)} aria-label="Remove">&#215;</button></div></div><strong title={item.file.name}>{item.file.name}</strong><small>{bytes(item.file.size)}</small>
        </article>)}<button className="add" onClick={()=>input.current?.click()}><b>+</b>Add images</button></div>
        <div className="settings"><div className="title"><div><i>02</i><h2>Set the look</h2></div></div><div className="controls">
          <label><span>Page size</span><select value={size} onChange={e=>setSize(e.target.value as Size)}><option value="a4">A4</option><option value="letter">US Letter</option><option value="auto">Fit to image</option></select></label>
          <label><span>Orientation</span><select value={orientation} onChange={e=>setOrientation(e.target.value)}><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
          <label><span>Margin</span><select value={margin} onChange={e=>setMargin(Number(e.target.value))}><option value="0">None</option><option value="6">Small</option><option value="12">Comfortable</option></select></label>
          <label><span>Quality <b>{quality}%</b></span><input type="range" min="55" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label>
        </div></div>
        <div className="security-settings">
          <div className="title"><div><i>03</i><h2>Make PDF secure</h2></div></div>
          <div className={`security-card ${protectPdf?"enabled":""}`}>
            <div className="security-intro">
              <div>
                <strong>Password protect this PDF</strong>
                <p>The downloaded PDF will ask for this password before it opens.</p>
              </div>
              <label className="security-switch">
                <input aria-label="Password protect this PDF" type="checkbox" checked={protectPdf} onChange={e=>{setProtectPdf(e.target.checked);setError("");if(!e.target.checked){setPassword("");setConfirmPassword("");setShowPassword(false)}}}/>
                <span aria-hidden="true"></span>
                <b>{protectPdf?"On":"Off"}</b>
              </label>
            </div>
            {protectPdf&&<div className="password-fields">
              <label><span>Password</span><input type={showPassword?"text":"password"} value={password} maxLength={32} autoComplete="new-password" placeholder="4-32 characters" onChange={e=>setPassword(e.target.value)}/></label>
              <label><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} maxLength={32} autoComplete="new-password" placeholder="Enter it again" onChange={e=>setConfirmPassword(e.target.value)}/></label>
              <label className="show-password"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/>Show password</label>
            </div>}
            <div className="timed-lock-note">
              <b>About timed unlock</b>
              <p>A downloaded PDF cannot reliably unlock itself at a future time. That feature needs a separately hosted, time-gated download link, which we can build later.</p>
            </div>
          </div>
        </div>
        <div className="convert"><div><strong>{items.length} {items.length===1?"page":"pages"}</strong><small>{bytes(items.reduce((n,i)=>n+i.file.size,0))} selected</small></div><button className="primary" disabled={busy} onClick={makePdf}>{busy?"Creating your PDF...":protectPdf?"Create & download locked PDF":"Create & download PDF"}</button></div>
      </div>}
    </section>
    <section className="trust shell"><article><i>01</i><h3>Private by design</h3><p>Your files are processed locally and never uploaded to our servers.</p></article><article><i>02</i><h3>Any image, any order</h3><p>Mix formats, rotate pages, and put everything in the perfect order.</p></article><article><i>03</i><h3>Free without friction</h3><p>No account, no watermark, and no surprise paywall at the final step.</p></article></section>
    <section className="how shell"><small>SIMPLE ON PURPOSE</small><h2>From camera roll to PDF<br/>in three small steps.</h2><div><span>Choose your images</span><b>&rarr;</b><span>Arrange & style</span><b>&rarr;</b><span>Download your PDF</span></div></section>
    <SiteFooter/>
  </main>
}

