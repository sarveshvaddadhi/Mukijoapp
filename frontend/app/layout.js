import "./globals.css";
import CapacitorProvider from "../components/CapacitorProvider";

export const metadata = {
  title: "Mukijo",
  description: "Team Management Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && !window.fetchPatched) {
                  window.fetchPatched = true;
                  const originalFetch = window.fetch;
                  window.fetch = function (input, init) {
                    if (typeof input === 'string' && input.startsWith('/api')) {
                      const backendUrl = '${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}';
                      const cleanInput = backendUrl.replace(/\\/+$/, '') + '/' + input.replace(/^\\/+/, '');
                      return originalFetch(cleanInput, init);
                    }
                    return originalFetch(input, init);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-white">
        <CapacitorProvider>
          {children}
        </CapacitorProvider>
      </body>
    </html>
  );
}