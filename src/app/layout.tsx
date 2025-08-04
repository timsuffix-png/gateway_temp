import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ ตรงนี้ใส่ link ฟอนต์ */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@100;200;300;400;500;600;700&family=Outfit:wght@100..900&family=Playwrite+BE+VLG:wght@100..400&family=Quicksand:wght@300..700&family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col 2xl:flex-row  h-screen min-h-screen box-border">
        <header className="w-full 2xl:w-[20%] 2xl:h-screen ">
          <Navbar />
        </header>

        <main className="flex flex-col h-full overflow-y-auto box-border 2xl:w-[80%] 2xl:border-l-2 2xl:h-screen">
          {children}
          <div>
            <Footer />
          </div>
        </main>
        
        
      </body>
    </html>
  );
}
