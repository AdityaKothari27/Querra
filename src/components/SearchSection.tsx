import { FC, useState } from 'react';
import { SearchResult, SearchConfig } from '../types';
import { MagnifyingGlassIcon, ClockIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface SearchSectionProps {
  onSearch: (query: string, config: SearchConfig) => Promise<void>;
  onSourceSelect: (sources: string[]) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
}

const SearchSection: FC<SearchSectionProps> = ({
  onSearch,
  onSourceSelect,
  searchResults,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [timeFilter, setTimeFilter] = useState('Any');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, { maxResults, timeFilter });
      setSelectedResults([]);
    }
  };

  const handleResultSelect = (url: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedResults, url]
      : selectedResults.filter((item) => item !== url);
    
    setSelectedResults(newSelected);
    onSourceSelect(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    const allUrls = searchResults.map((result) => result.url);
    const newSelected = checked ? allUrls : [];
    setSelectedResults(newSelected);
    onSourceSelect(newSelected);
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-indigo-900/20">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-indigo-400" />
        Research Topic
      </h2>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your research topic..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 transition-all duration-300"
            />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-6 w-6 border-t-2 border-blue-500 dark:border-indigo-500 border-r-2 border-blue-500 dark:border-indigo-500 rounded-full"></div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="md:w-auto px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-indigo-600 dark:to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 dark:hover:from-indigo-500 dark:hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-indigo-500/20"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Max Results
              </label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white"
              >
                {[5, 10, 15, 20].map((num) => (
                  <option key={num} value={num}>
                    {num} results
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Time Filter
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white"
              >
                {['Any', 'Past 24 hours', 'Past week', 'Past month', 'Past year'].map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>

      {searchResults.length > 0 && (
        <div className="mt-8 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Search Results</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedResults.length === searchResults.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-indigo-600 focus:ring-blue-500 dark:focus:ring-indigo-500 bg-white dark:bg-slate-700"
              />
              <label htmlFor="select-all" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                Select All
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div 
                key={result.url} 
                className="bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors duration-300"
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedResults.includes(result.url)}
                    onChange={(e) => handleResultSelect(result.url, e.target.checked)}
                    className="h-4 w-4 mt-1 rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-indigo-600 focus:ring-blue-500 dark:focus:ring-indigo-500 bg-white dark:bg-slate-700"
                  />
                  <div className="ml-3 flex-1">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">{result.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">{result.snippet}</p>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 dark:text-indigo-400 hover:text-blue-500 dark:hover:text-indigo-300 transition-colors mt-2 inline-block"
                    >
                      {result.url}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSection; 