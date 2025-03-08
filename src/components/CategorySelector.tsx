import { FC } from 'react';
import { categories } from '../config/categories';
import { 
  GlobeAltIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  ComputerDesktopIcon, 
  HeartIcon, 
  ScaleIcon 
} from '@heroicons/react/24/outline';

interface CategorySelectorProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const CategorySelector: FC<CategorySelectorProps> = ({ 
  selectedCategory, 
  onCategorySelect 
}) => {
  // Map of icon components
  const iconMap: Record<string, React.ReactNode> = {
    GlobeAltIcon: <GlobeAltIcon className="h-6 w-6" />,
    AcademicCapIcon: <AcademicCapIcon className="h-6 w-6" />,
    ChartBarIcon: <ChartBarIcon className="h-6 w-6" />,
    ComputerDesktopIcon: <ComputerDesktopIcon className="h-6 w-6" />,
    HeartIcon: <HeartIcon className="h-6 w-6" />,
    ScaleIcon: <ScaleIcon className="h-6 w-6" />,
  };

  // Map of color classes
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  };

  // Map of selected color classes
  const selectedColorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white border-blue-700 dark:bg-blue-700 dark:border-blue-600',
    purple: 'bg-purple-600 text-white border-purple-700 dark:bg-purple-700 dark:border-purple-600',
    green: 'bg-green-600 text-white border-green-700 dark:bg-green-700 dark:border-green-600',
    indigo: 'bg-indigo-600 text-white border-indigo-700 dark:bg-indigo-700 dark:border-indigo-600',
    red: 'bg-red-600 text-white border-red-700 dark:bg-red-700 dark:border-red-600',
    amber: 'bg-amber-600 text-white border-amber-700 dark:bg-amber-700 dark:border-amber-600',
  };

  return (
    <div className="bg-white dark:bg-gray-900 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Select Research Category
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id || '')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
              selectedCategory === category.id
                ? selectedColorMap[category.color]
                : `${colorMap[category.color]} hover:bg-opacity-80`
            }`}
          >
            <div className="mb-2">
              {category.icon && iconMap[category.icon]}
            </div>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector; 