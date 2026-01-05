import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Audio to Jira | Speech-to-Tickets POC',
  description: 'Convert refinement sessions to structured Jira tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 flex-shrink-0">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            {/* Logo: Mic to Jira */}
            <svg width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Microphone */}
              <rect x="2" y="6" width="12" height="20" rx="6" fill="#2563eb"/>
              <path d="M2 22v1a6 6 0 0012 0v-1" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
              <line x1="8" y1="29" x2="8" y2="33" stroke="#2563eb" strokeWidth="1.5"/>
              <line x1="5" y1="33" x2="11" y2="33" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Arrow */}
              <path d="M18 20h8m-3-3l3 3-3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Jira Logo */}
              <g transform="translate(30, 8)">
                <path d="M11.53 2H2.47A2.47 2.47 0 000 4.47v15.06A2.47 2.47 0 002.47 22h9.06a2.47 2.47 0 002.47-2.47V4.47A2.47 2.47 0 0011.53 2z" fill="#2684FF"/>
                <path d="M10.83 6H3.17A1.17 1.17 0 002 7.17v1.66A1.17 1.17 0 003.17 10h7.66A1.17 1.17 0 0012 8.83V7.17A1.17 1.17 0 0010.83 6z" fill="white"/>
                <path d="M8.5 12h-5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5z" fill="white" opacity="0.7"/>
                <path d="M7 16H3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5H7a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5z" fill="white" opacity="0.5"/>
              </g>
            </svg>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                Audio to Jira
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                Refinement sessies naar gestructureerde tickets
              </p>
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-6 py-6 sm:py-8 flex-1 pb-16 sm:pb-20">
          {children}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white z-10">
          <div className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-500">
            POC - Audio verwerking via EU endpoints
          </div>
        </footer>
      </body>
    </html>
  );
}
