// components/Layout.js
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="container">
        {children}
      </main>
      <style jsx>{`
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 60px;
        }
      `}</style>
    </>
  );
}
