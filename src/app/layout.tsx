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
      <body className="flex flex-col 2xl:flex-row min-h-screen box-border">
        <header className="w-full 2xl:w-[20%] 2xl:h-screen ">
          <Navbar />
        </header>

        <main className="flex flex-col overflow-y-auto box-border 2xl:w-[80%] 2xl:border-l-2 2xl:h-screen">
          {children}
          <div className="">
         <Footer />
          </div>
        </main>
      </body>
    </html>
  );
}
