import "./globals.css";

export const metadata = {
  title: "Mukijo",
  description: "Team Management Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        {children}
      </body>
    </html>
  );
}