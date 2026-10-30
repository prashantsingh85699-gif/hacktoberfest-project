import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';

import { ErrorBoundary } from './components/layout/ErrorBoundary.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';

import { Home } from './pages/Home.jsx';
import { Scanner } from './pages/Scanner.jsx';
import { Result } from './pages/Result.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { History } from './pages/History.jsx';
import { About } from './pages/About.jsx';
import { NotFound } from './pages/NotFound.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#F7F8FB] text-[#0B1F33]">
          <Toaster richColors position="top-right" />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<Scanner />} />
              <Route path="/result/:id" element={<Result />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/how-it-works" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
