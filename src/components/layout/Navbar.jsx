import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Camera, History, BarChart3, HelpCircle, Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Scan', path: '/scan', icon: Camera, primary: true },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'History', path: '/history', icon: History },
    { name: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E7EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-150">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-[#0B1F33] tracking-tight">
                ExpiryWatch<span className="text-indigo-600">.AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                assistive inspector
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              if (link.primary) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="inline-flex items-center gap-2 px-4 py-2 ml-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors duration-150"
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E7EF] bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium min-h-[44px] ${
                  link.primary
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isActive
                    ? 'bg-slate-100 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
