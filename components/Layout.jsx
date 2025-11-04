import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="container" style={{paddingTop:20, paddingBottom:40}}>
        {children}
      </main>
      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} LSranks</div>
      </footer>
    </>
  );
}
