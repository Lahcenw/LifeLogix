// src/components/Navbar.jsx

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image'; 
import logo from '../images/LifeLogix_Logo.png';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { name: 'Journaling', href: '/dashboard' },
    { name: 'Activities', href: '/activities' },
    { name: 'Goals', href: '/goals' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; 
  };

  return (
    <nav className="bg-black text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link href="./dashboard" className="text-2xl font-bold text-indigo-400">
          <Image
            src={logo}
            alt="LifeLogix Logo"
            width={200}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-lg hover:text-indigo-400 transition-colors duration-200 ${
                pathname === link.href ? 'text-indigo-400 font-semibold border-b-2 border-indigo-400' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="py-2 px-4 bg-red-600 rounded-md font-semibold hover:bg-red-700 transition duration-200"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="focus:outline-none">
            {isMobileMenuOpen ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col items-center mt-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={toggleMobileMenu} // Close menu on click
              className={`block w-full text-center py-2 text-lg hover:bg-gray-700 rounded-md ${
                pathname === link.href ? 'text-indigo-400 font-semibold bg-gray-700' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-center py-2 text-lg bg-red-600 rounded-md font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}