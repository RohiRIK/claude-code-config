import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LTM Graph",
  description: "Long-term memory visualizer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col">
        <nav className="flex items-center gap-1 px-4 py-1.5 bg-[#0d1117] border-b border-gray-800 text-xs">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800">
            Graph
          </Link>
          <Link href="/pending" className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800">
            Pending
          </Link>
          <Link href="/health" className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800">
            Health
          </Link>
          <Link href="/settings" className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800">
            Settings
          </Link>
        </nav>
        <div className="flex-1 overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
