import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const tools = [
  {
    slug: "image-to-pdf-complete-guide", toolPath: "/image-to-pdf", tag: "IMAGE TO PDF",
    title: "How to Convert Images to PDF Without Losing the Story in Them",
    description: "A practical, privacy-conscious guide to turning JPG, PNG, WebP, HEIC, GIF and other images into a clean, correctly ordered PDF.",
    action: "convert images into a PDF", output: "image-based PDF", input: "photos and image files",
    moment: "a folder of photographed certificates, handwritten class notes and phone screenshots",
    worry: "whether the pages would appear in the wrong order or the small handwriting would become blurry",
    choices: "page size, orientation, margins, image order and export quality",
    example: "A student sending twelve pages of handwritten notes should name and arrange them in reading order, use A4 pages, keep a small margin, and choose a quality level that preserves fine pen strokes.",
    mistake: "treating every image as if it has the same shape. Portrait receipts, landscape charts and tall phone screenshots need a deliberate orientation decision",
    result: "one calm, readable document instead of a chat full of unrelated pictures",
    scenarios: ["submitting photographed assignments", "sharing identity documents with an authorised office", "archiving family photographs with captions", "combining receipts for an expense claim", "sending product images to a client"],
  },
  {
    slug: "merge-pdf-complete-guide", toolPath: "/merge-pdf", tag: "MERGE PDF",
    title: "How to Merge PDF Files and Keep Every Page in the Right Place",
    description: "Learn how to combine multiple PDFs safely, choose sensible quality, handle protected files and produce one organised document.",
    action: "merge PDF files", output: "single combined PDF", input: "separate PDF documents",
    moment: "an application form, payment receipt, cover letter and supporting certificate saved as four separate PDFs",
    worry: "whether one forgotten page or a wrong order would make the final submission look careless",
    choices: "file order, source quality, duplicate removal and optional output protection",
    example: "For a job application, place the cover letter first, the form second, certificates next and supporting receipts last. Open the merged file once before sending it.",
    mistake: "assuming upload order is automatically the correct reading order. Files selected together may arrive alphabetically or in a device-dependent sequence",
    result: "a document that feels intentionally assembled rather than digitally stapled together",
    scenarios: ["combining an application and its evidence", "assembling monthly invoices", "joining scanned chapters", "preparing a legal review bundle", "collecting a project report and appendices"],
  },
  {
    slug: "pdf-unlocker-guide", toolPath: "/pdf-unlocker", tag: "PDF UNLOCKER",
    title: "How PDF Unlocking Works: A Responsible Guide for Files You Own",
    description: "Understand PDF restrictions, passwords, browser-side processing and the safe way to create an unrestricted copy of an authorised document.",
    action: "remove restrictions from an authorised PDF", output: "usable unlocked copy", input: "PDF files you own or are permitted to edit",
    moment: "an old department document that opens normally but refuses to print, copy text or join another PDF",
    worry: "whether changing the file would damage its pages, signatures or evidentiary value",
    choices: "authorisation, encryption type, document integrity, output naming and secure storage",
    example: "If an archived report opens but printing is restricted, first preserve the original, confirm that your team is authorised to modify it, then create and clearly label a working copy.",
    mistake: "confusing an owner-permission restriction with a password that encrypts the document contents. Strong open-password encryption cannot responsibly be bypassed by a browser tool",
    result: "an authorised working copy while the untouched original remains available for audit or recovery",
    scenarios: ["printing an authorised archive", "merging a permitted restricted report", "recovering accessibility workflows", "moving records into a new document system", "preparing an internal review copy"],
  },
  {
    slug: "compress-pdf-complete-guide", toolPath: "/compress-pdf", tag: "COMPRESS PDF",
    title: "How to Compress a PDF Without Making It Look Cheap or Blurry",
    description: "A clear guide to reducing PDF size while protecting readable text, useful images and the professional feel of your document.",
    action: "compress a PDF", output: "smaller PDF", input: "large PDF documents",
    moment: "a carefully prepared portfolio that is just over an email attachment limit minutes before a deadline",
    worry: "whether saving a few megabytes would turn crisp diagrams and text into a fuzzy mess",
    choices: "compression strength, image resolution, acceptable file size and the document's real viewing conditions",
    example: "A text-heavy application can usually tolerate stronger image compression than a photography portfolio. Test the smallest detailed page, not only the cover.",
    mistake: "choosing maximum compression before asking how the recipient will use the file. On-screen reading, office printing and professional press output have very different needs",
    result: "a file that travels easily while still looking like the document you worked hard to create",
    scenarios: ["meeting an upload portal limit", "emailing a portfolio", "reducing scanned paperwork", "sharing a report on mobile data", "archiving duplicate working copies"],
  },
  {
    slug: "split-pdf-complete-guide", toolPath: "/split-pdf", tag: "SPLIT PDF",
    title: "How to Split a PDF and Take Only the Pages You Actually Need",
    description: "Extract pages, divide page ranges and separate a large PDF into useful smaller documents without losing track of context.",
    action: "split a PDF", output: "smaller page-specific PDFs", input: "multi-page PDF documents",
    moment: "a 180-page report when a colleague only needs the six pages covering one decision",
    worry: "whether the selected range would omit a heading, footnote or supporting page that changes the meaning",
    choices: "page ranges, extraction mode, output names, context pages and download format",
    example: "When sharing pages 42 to 47 of a report, check whether page 41 contains the section heading and whether page 48 contains notes or a continuation.",
    mistake: "selecting pages from memory instead of previewing the document. Printed page numbers can differ from the PDF viewer's page count because of covers and front matter",
    result: "a focused document that respects the recipient's time without stripping away necessary context",
    scenarios: ["extracting one invoice from a batch", "sharing a chapter", "separating scanned records", "creating handouts from a manual", "sending selected contract schedules"],
  },
];

const paragraphs = (t) => [
  {
    heading: `Why ${t.action} is a small task that deserves care`,
    paragraphs: [
      `The request usually sounds simple: “Can you just ${t.action}?” Yet the file often carries more than pages. It may contain an application someone has spent an evening completing, notes taken during an important class, a report needed for a morning meeting, or records that must remain private. That is why a good workflow is not only about pressing a button. It is about keeping the information complete, readable and easy for the next person to understand. Paperly was designed around that ordinary but very human moment when technology should quietly help instead of creating one more problem.`,
      `Imagine opening ${t.moment}. The first feeling is rarely excitement; it is usually mild pressure. You may be thinking about ${t.worry}. A dependable process turns that uncertainty into a short checklist. You confirm the files, decide what the finished document should look like, process it, and inspect the result. Those few minutes of attention protect the effort already invested in the content.`,
    ],
  },
  {
    heading: `Before you begin: decide what “finished” means`,
    paragraphs: [
      `Before touching any setting, picture the recipient. Will they read the document on a phone, print it on office paper, upload it to a government portal, or keep it as an archive? A file that is perfect for quick mobile sharing may not be ideal for detailed printing. Write down the non-negotiables: every required page must be present, text must remain readable, private material must stay controlled, and the final name should explain what the file contains. This tiny pause prevents most avoidable mistakes.`,
      `For this task, the practical decisions are ${t.choices}. Do not choose settings because they sound technically impressive. Choose them because they serve the document. ${t.example} The most professional result is often the one that feels uneventful to the reader: it opens quickly, begins where expected, and never makes them wonder whether something is missing.`,
    ],
  },
  {
    heading: `A step-by-step Paperly workflow`,
    paragraphs: [
      `Open the ${t.tag.toLowerCase()} tool from the Paperly home page. Add the ${t.input} you are authorised to use. Once files appear, read every filename and compare the count with the source folder. If the tool offers reordering, page selection or quality controls, set them now. Avoid rushing simply because the interface looks easy; a friendly interface removes friction, but it cannot know the story your pages are supposed to tell.`,
      `Next, preview the sequence and settings. Process the files and wait for the completion message rather than repeatedly clicking the action button. Download the ${t.output} into a location you can find, preferably with a descriptive name and date. Finally, open that downloaded copy in a separate viewer. Check the first page, last page, one dense text page and any page containing a detailed image or unusual layout. This final inspection is the digital equivalent of looking through a parcel before sealing it.`,
    ],
  },
  {
    heading: `Order, names and the quiet value of organisation`,
    paragraphs: [
      `File order communicates meaning. A cover sheet before evidence feels natural; evidence before its explanation feels confusing. Use short filenames with words a human can recognise, such as project-name_document-type_2026.pdf. Avoid names such as final-final-new-2.pdf. If several people are collaborating, agree on a naming pattern before processing. The minutes saved later are far greater than the minute spent naming the file now.`,
      `Keep the untouched source beside the new output until the work has been accepted. A folder with Original, Working and Final subfolders is enough for many people. In a department, follow the official record-retention policy instead. Organisation is not glamorous, but it gives you a reassuring way back when a page is wrong, a setting needs to change, or someone asks how the result was created.`,
    ],
  },
  {
    heading: `Quality is not a single percentage`,
    paragraphs: [
      `People often ask for “the best quality” as though there were one universal number. In practice, quality is the balance between clarity, file size and purpose. A page of typed text needs sharp edges. A scanned receipt needs legible small print. A photograph needs smooth colour and detail. Review the most demanding page in the document and let that page guide the setting. If it remains clear at a sensible zoom level, the rest of the file will usually follow.`,
      `Repeated conversion can slowly damage visual material. Whenever possible, process the original ${t.input} rather than an already compressed copy forwarded through a messaging app. Save the finished file once, inspect it, and return to the source if a change is required. This habit preserves detail and makes the workflow repeatable instead of turning each revision into a slightly blurrier version of the last.`,
    ],
  },
  {
    heading: `Privacy: know where the work happens`,
    paragraphs: [
      `Documents can contain addresses, signatures, financial details, medical information or private photographs. Before using any online utility, ask whether files leave the device, how long they are retained and whether the connection is encrypted. Paperly's core processing is designed to happen in the browser for supported workflows, so the document does not need to be sent to a conversion server. That reduces exposure, although users should still protect their own device and download folder.`,
      `Browser-side processing does not make every environment automatically safe. Avoid sensitive work on a shared computer. Lock the screen when stepping away, use an up-to-date browser, and remove temporary downloads according to your organisation's policy. If a document is legally privileged, classified or governed by a strict contract, follow the approved internal system even when another option feels faster. Privacy is a chain, and the conversion step is only one link.`,
    ],
  },
  {
    heading: `Common mistake: ${t.mistake}`, 
    paragraphs: [
      `This mistake is understandable because we naturally focus on finishing. The fix is to slow down at the decision point, not throughout the whole process. Look at the source once, predict the desired result, and then choose the setting. A thirty-second preview can prevent a second conversion, an embarrassed follow-up email, or a rejected portal submission.`,
      `Another common problem is trusting the download without opening it. A successful message only confirms that processing finished; it does not confirm that the result matches your intention. The useful definition of success is ${t.result}. Treat visual inspection as part of the task, not an optional extra after the task.`,
    ],
  },
  {
    heading: `Real situations where the tool earns its place`,
    paragraphs: [
      `${t.scenarios.slice(0,3).join(", ")} are different jobs, but they share one need: the recipient should receive exactly enough information in a form that opens easily. In each situation, start with the audience. A teacher wants pages in assignment order. An accounts team wants dates and totals readable. A client wants a polished file that does not feel improvised.`,
      `${t.scenarios.slice(3).join(" and ")} may require a more formal review. Confirm page numbering, confidentiality labels and local retention rules. If the document will become part of an official record, note who prepared it and preserve the source. The tool makes the mechanical step quicker; professional judgement still gives the file its reliability.`,
    ],
  },
  {
    heading: `Accessibility makes a document kinder to use`,
    paragraphs: [
      `A PDF can look correct and still be difficult for someone using magnification, a small screen or assistive technology. Keep pages upright, use generous enough margins, and avoid text that is only barely readable. Image-only documents may not contain selectable text, so important long-term records can benefit from OCR in an approved workflow. Meaningful filenames also help users who navigate downloads with a screen reader.`,
      `Do not rely on colour alone to communicate which page matters. Preserve headings and enough surrounding context for the extracted material to make sense. Accessibility is not a decorative finishing touch. It is the habit of remembering that the person opening the file may read differently from you, under different lighting, on slower hardware, or during a stressful moment.`,
    ],
  },
  {
    heading: `How to check the result in under two minutes`,
    paragraphs: [
      `First compare the output page count with your plan. Then open the first and last pages to catch missing boundaries. Jump to a middle page with small text, zoom in, and confirm that letters remain distinct. Check any rotated, unusually wide or image-heavy page. Search for a known word when searchable text matters. If security was applied, close the viewer completely and reopen the file to test it honestly.`,
      `Finally, look at the filename and file size. The name should be understandable outside its current folder, and the size should suit the delivery method. Send the document to yourself or test it in the actual upload portal when the deadline matters. This small routine is simple enough to remember and strong enough to catch most real-world failures.`,
    ],
  },
  {
    heading: `Troubleshooting when the file does not behave`,
    paragraphs: [
      `If processing stops, try fewer files at once and close memory-heavy browser tabs. Very large documents can exceed the memory available to a phone or older laptop because browser processing keeps working data locally. Confirm that the source file opens normally. A damaged, incomplete or incorrectly named file may fail even when its extension looks familiar.`,
      `If the result is too large, reduce image quality one step and compare the detailed page again. If pages look soft, return to the original and raise quality rather than recompressing the output. If order is wrong, correct it in the tool and create a fresh copy. Keep notes when a particular source causes repeated trouble; patterns such as one scanner, one export program or one unusual page size often reveal the cause.`,
    ],
  },
  {
    heading: `Working on phones, older computers and slow connections`,
    paragraphs: [
      `A phone is convenient for a short document, especially when the source was photographed there. For large batches, a laptop usually provides more memory, a larger preview and easier file organisation. Keep the device charged and avoid switching apps during a heavy operation. Because supported Paperly processing happens locally, internet speed is less important after the page and required code have loaded, but device capability still matters.`,
      `On an older computer, process smaller batches and combine the results carefully if the workflow permits. Close duplicate viewers and save output to a local folder before moving it to cloud storage. Patience is part of reliability here: a slower device is not necessarily failing. Give the browser time to finish and watch for a clear completion or error message.`,
    ],
  },
  {
    heading: `A practical standard for teams`,
    paragraphs: [
      `Teams benefit from a one-page procedure: approved tool, allowed document types, naming pattern, quality target, review steps and storage location. Assign a second-person check for high-impact submissions. The checker does not need to repeat the conversion; they only need to verify completeness, order, readability and destination. This makes responsibility clear without turning a simple PDF task into bureaucracy.`,
      `Record exceptions. If a file needs unusual handling, note why. If sensitive content must use an internal platform, say so in the procedure. Review the standard when browsers, policies or business needs change. Consistency builds trust because colleagues know what “final PDF” means, and new team members do not have to learn through avoidable mistakes.`,
    ],
  },
  {
    heading: `Sharing the file with confidence`,
    paragraphs: [
      `The moment after processing matters as much as the moment before it. Do not attach the file to the first message window that happens to be open. Confirm the recipient, choose a clear subject line and add one sentence explaining what the document contains. If it replaces an earlier version, say that directly. If the recipient needs to review a specific page, mention the page number. These details reduce the quiet anxiety people feel when an unexplained attachment arrives and they have to guess what is expected of them.`,
      `For sensitive work, use the approved delivery channel and avoid copying more people than necessary. When a deadline is close, ask for confirmation of receipt instead of sending the same document repeatedly. A good handoff gives the recipient context without overwhelming them: what the file is, why they are receiving it, whether action is required, and when that action is due. The technology creates the ${t.output}; thoughtful communication makes it genuinely useful. That final human layer is often what separates a merely correct file from a professional and considerate piece of work.`,
      `Once the recipient confirms that everything is usable, tidy the working folder. Keep what policy requires, remove needless temporary copies, and record the final location if other people may need it later. Finishing cleanly prevents tomorrow's confusion and makes the next similar task feel familiar rather than stressful. It also leaves a simple trail that a colleague can understand without asking you to reconstruct every choice from memory.`,
    ],
  },
  {
    heading: `The final checklist`,
    paragraphs: [
      `Use this short checklist before sharing: the source is authorised; all required files are present; pages are in the intended order; orientation is correct; small text is readable; the output opens in another viewer; security settings match the purpose; the filename is clear; and the original remains safely stored. For official work, also confirm the recipient, deadline and retention rule.`,
      `When every item is true, the task is finished. The best PDF tools are almost invisible at that moment. They let the reader focus on the application, lesson, memory, report or decision inside the pages. That is the standard Paperly aims for: less friction around the document, and more respect for the human work the document represents.`,
    ],
  },
];

const faq = (t) => [
  { question: `Can I ${t.action} for free?`, answer: `Yes. Paperly currently offers this workflow without a subscription or watermark. Device memory and browser limits can still affect extremely large files.` },
  { question: "Are my files uploaded to a server?", answer: "Supported Paperly PDF operations are performed in the browser. Always follow your organisation's rules for confidential or regulated documents." },
  { question: "Will the output look exactly like the source?", answer: `The goal is faithful output, but ${t.choices} can affect appearance or size. Open and inspect the downloaded file before relying on it.` },
  { question: "What should I do if processing fails?", answer: "Confirm that the source opens, try a current browser, close memory-heavy tabs and process a smaller batch. Preserve the original while troubleshooting." },
  { question: "Can I use the result for an official submission?", answer: "Usually, if the receiving organisation accepts PDF and the document meets its size, quality, signature and security rules. Check those requirements first." },
];

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

const posts = tools.map((tool) => {
  const sections = paragraphs(tool);
  const post = {
    ...tool,
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-16",
    readMinutes: 14,
    intro: `There is usually a real deadline, memory or responsibility behind a PDF task. This guide explains how to ${tool.action} with a calm, repeatable process—without losing sight of privacy, readability or the person who will open the result.`,
    sections,
    faq: faq(tool),
  };
  const text = [post.title, post.description, post.intro, ...sections.flatMap((s) => [s.heading, ...s.paragraphs]), ...post.faq.flatMap((f) => [f.question, f.answer])].join(" ");
  post.wordCount = wordCount(text);
  return post;
});

for (const post of posts) {
  if (post.wordCount < 2500 || post.wordCount > 3000) {
    throw new Error(`${post.slug} has ${post.wordCount} words; expected 2500–3000.`);
  }
  console.log(`${post.slug}: ${post.wordCount} words`);
}

const target = path.join(root, "app/blog/tool-posts.generated.json");
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
