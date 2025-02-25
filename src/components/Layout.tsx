import { FC, ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import { MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

export const navigationItems = [
  { name: 'Search & Generate', icon: MagnifyingGlassIcon, path: '/' },
  { name: 'Knowledge Base', icon: BookOpenIcon, path: '/knowledge-base' }
];

const Layout: FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        navigationItems={navigationItems}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 