import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ШСО | Единая База Данных',
  description: 'Единая база данных студенческих отрядов',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
