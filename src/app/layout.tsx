// ✅ pomodoro-app/app/layout.tsx
import "./globals.css"

export const metadata = {
  title: "Web3 Pomodoro",
  description: "Focus like a crypto trader",
}

import Navbar from '@/components/Navbar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white`}>
        <div className="max-w-3xl mx-auto p-4">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}