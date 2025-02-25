import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
// import { SearchIcon, BeakerIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  icon: any; // Using 'any' since HeroIcon type is complex
  path: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  navigationItems: NavigationItem[];
}

const Sidebar: FC<SidebarProps> = ({ isOpen, onToggle, navigationItems }) => {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} transition-width duration-300 bg-white shadow`}>
      {/* Add sidebar content here */}
    </aside>
  );
};

export default Sidebar; 