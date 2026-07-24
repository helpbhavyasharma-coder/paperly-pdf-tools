import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={
  title:"Paperly — Free Image to PDF Converter",
  description:"Convert JPG, PNG, WebP, HEIC and other images into a polished PDF. Free, private, and no sign-up required.",
  icons:{icon:"/favicon.svg"},
  openGraph:{title:"Paperly — Free Image to PDF Converter",description:"Turn any image into a beautiful PDF. Free, private, and no sign-up.",images:[{url:"/og.png",width:1728,height:907,alt:"Paperly image to PDF converter"}]},
  twitter:{card:"summary_large_image",title:"Paperly — Free Image to PDF Converter",description:"Turn any image into a beautiful PDF. Free, private, and no sign-up.",images:["/og.png"]}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
