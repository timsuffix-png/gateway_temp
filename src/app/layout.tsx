import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="w-full max-w-screen min-h-screen overflow-y-auto box-border">
          {children}
        </div>
      </body>
    </html>
  );
}
