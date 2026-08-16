import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://paperly-image-pdf.bbdesktop01.chatgpt.site"),
  title:"Paperly by Bhauu — Free, Simple PDF Tools",
  description:"Paperly is a free PDF tools product built by Bhauu. Convert images, merge, compress, split and responsibly unlock supported PDFs without a watermark.",
  alternates:{canonical:"/"},
  keywords:["Paperly","Bhauu PDF tools","Bhauu software company","PDF tools","image to PDF","merge PDF","compress PDF","split PDF","PDF unlocker"],
  icons:{icon:"/favicon.svg"},
  openGraph:{title:"Paperly — Simple PDF Tools",description:"Simple PDF tools. Thoughtfully made. Free, private, and no sign-up.",images:[{url:"/og-tools.png",width:1536,height:1024,alt:"Paperly simple PDF tools"}]},
  twitter:{card:"summary_large_image",title:"Paperly — Simple PDF Tools",description:"Simple PDF tools. Thoughtfully made. Free, private, and no sign-up.",images:["/og-tools.png"]}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

