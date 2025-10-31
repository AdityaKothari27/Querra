import { FC, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from '../contexts/SessionContext';
import { BookOpenIcon, SunIcon, MoonIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useToast } from './Toast';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const { clearSession } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    // Add scroll listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Update document class when theme changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-white transition-colors duration-300">
    <header
      className={`sticky top-0 z-10 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-white/50 dark:bg-black/50 shadow-sm'
          : 'backdrop-blur-md bg-white/30 dark:bg-black/30'
      } border-b border-white/20 dark:border-gray-800/20`}
      style={{
        backgroundImage:
          'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.1))',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center group">
          <div className="relative h-10 w-13">
            <Image
              src={darkMode ? "/images/querrawobgdark.png" : "/images/querrawobg.png"}
              alt="Querra Logo"
              width={100}
              height={40}
              className="transition-transform group-hover:scale-105"
              priority
            />
          </div>
          </Link>
          <div className="flex items-center space-x-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full  text-gray-800 dark:text-white transition-colors duration-300 shadow-sm border border-1 hover:border-gray-600 dark:hover:border-black"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5 hover:text-black" />
              ) : (
                <MoonIcon className="h-5 w-5 hover:text-black" />
              )}
            </button>
            
            <button 
              onClick={() => {
                clearSession();
                showToast({
                  type: 'success',
                  message: 'Session cleared successfully!'
                });
              }}
              className="p-2 rounded-full text-gray-800 dark:text-white transition-colors duration-300 shadow-sm border border-1 hover:border-gray-600 dark:hover:border-gray-600"
              // hover:bg-gray-200 dark:hover:bg-gray-700
              aria-label="Clear session"
              title="Clear session"
            >
              <TrashIcon className="h-5 w-5 hover:text-black" />
            </button>
            
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/" 
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 flex items-center"
                  >
                    Search
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/knowledge-base" 
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 flex items-center space-x-1"
                  >
                    <BookOpenIcon className="h-5 w-5" />
                    <span>Knowledge Base</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-100 dark:bg-black border-t border-gray-200 dark:border-gray-800 py-6 transition-colors duration-300">
        <div className="container mx-auto px-4 grid grid-cols-3 text-gray-600 dark:text-gray-400">
          <div className="text-left">
            <a href="https://github.com/AdityaKothari27/Querra" className="hover:text-blue-500 dark:hover:text-blue-400" target='_blank'>Source Code</a>
          </div>
          <div className="text-center flex items-center justify-center space-x-2">
            <span>Made by <a href="https://github.com/AdityaKothari27" className="hover:text-blue-500 dark:hover:text-blue-400" target='_blank'>Aditya Kothari</a></span>
            <div className="flex items-center space-x-2 ml-2">
              <a href="https://x.com/aditya_kothari1?s=21" className="hover:opacity-80 transition-opacity duration-300" title="Follow on X" target='_blank'>
                <Image 
                  src={darkMode ? "/images/logo-white.png" : "/images/logo-black.png"}
                  alt="X (Twitter)" 
                  width={16} 
                  height={16}
                />
              </a>
              <a href="https://www.linkedin.com/in/adityakothari27" className="hover:opacity-80 transition-opacity duration-300" title="Connect on LinkedIn" target='_blank'>
                <Image 
                  src="/images/LinkedIn_icon.png" 
                  alt="LinkedIn" 
                  width={19} 
                  height={19} 
                />
              </a>
            </div>
          </div>
          <div className="text-right">
            <a href="https://www.producthunt.com/products/querra" target="_blank">Product Hunt</a>
            
          </div>
        </div>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
};

export default Layout; 