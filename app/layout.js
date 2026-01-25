export const metadata = {
  title: 'Restaurant Backend',
  description: 'API for Restaurant App',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
