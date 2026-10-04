import type { ReactNode } from "react";

export const metadata = { title: "Hypernet", robots: { index: false, follow: false } };

// Only the small test pages under /dev use this layout; the prototype at / is plain HTML.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f8f7f3", color: "#161616" }}>
        {children}
      </body>
    </html>
  );
}
