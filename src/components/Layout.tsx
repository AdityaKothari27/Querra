import { FC, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { BeakerIcon, BookOpenIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);

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
      <header className={`sticky top-0 z-10 transition-all duration-300 ${
        scrolled 
          ? 'backdrop-blur-xl bg-white dark:bg-black shadow-md' 
          : 'backdrop-blur-md bg-white dark:bg-black'
      } border-b border-gray-200 dark:border-gray-800`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <BeakerIcon className="h-8 w-8 text-blue-600 dark:text-indigo-400 group-hover:text-blue-500 dark:group-hover:text-indigo-300 transition-colors duration-300" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Deep Search
            </span>
          </Link>
          <div className="flex items-center space-x-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 shadow-sm"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/" 
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 flex items-center"
                  >
                    Research
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
      <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Deep Search. Made with Vibe coding.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 