// ✅ pomodoro-app/app/layout.tsx
import './globals.css'

export const metadata = {
  title: 'Pomodoro Timer',
}

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen flex flex-col">
        <div className="flex-grow w-full max-w-3xl mx-auto p-4 flex flex-col">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
