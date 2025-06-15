import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClientWrapper from './ClientWrapper'

export const metadata = {
  title: 'Pomodoro Timer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen flex flex-col">
        <ClientWrapper>
          <div className="flex-grow w-full max-w-3xl mx-auto p-4 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
              {/* Spacer untuk jarak ke footer */}
              <div className="mt-12" />
            </main>
            <Footer />
          </div>
        </ClientWrapper>
      </body>
    </html>
  )
}
