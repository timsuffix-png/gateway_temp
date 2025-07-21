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
        <header className="w-full  h-auto 2xl:w-[20%] 2xl:h-full ">
          <Navbar />
        </header>

        <main className="flex-1 h-full overflow-y-auto box-border 2xl:w-[80%] border border-amber-600">
          {children}
          <div className="w-full p-2">
            <Footer />
          </div>
        </main>
      </body>
    </html>
  );
}
