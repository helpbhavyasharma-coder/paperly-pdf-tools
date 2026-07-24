import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={
  title:"Paperly — Simple PDF Tools",
  description:"Free, private PDF tools with no sign-up, no watermark, and no complicated steps.",
  icons:{icon:"/favicon.svg"},
  openGraph:{title:"Paperly — Simple PDF Tools",description:"Simple PDF tools. Thoughtfully made. Free, private, and no sign-up.",images:[{url:"/og-tools.png",width:1536,height:1024,alt:"Paperly simple PDF tools"}]},
  twitter:{card:"summary_large_image",title:"Paperly — Simple PDF Tools",description:"Simple PDF tools. Thoughtfully made. Free, private, and no sign-up.",images:["/og-tools.png"]}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

