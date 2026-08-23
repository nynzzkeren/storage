import './globals.css';

export const metadata = {
  title: 'Minimalist Storage',
  description: 'A premium black and white web storage.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
