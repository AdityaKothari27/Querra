import { FC, useState, useEffect } from 'react';
import { SearchResult, SearchConfig, CategoryConfig } from '../types/index';
import { MagnifyingGlassIcon, ClockIcon, AdjustmentsHorizontalIcon, InformationCircleIcon, MinusCircleIcon, PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import DocumentSelector from './DocumentSelector';
import { useToast } from './Toast';
import { useSession } from '../contexts/SessionContext';

interface SearchSectionProps {
  onSearch: (query: string, config: SearchConfig) => Promise<void>;
  onSourceSelect: (sources: string[], documentIds: number[]) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
  categoryConfig: CategoryConfig;
  selectedSources: string[];
  selectedDocumentIds: number[];
}

const SearchSection: FC<SearchSectionProps> = ({
  onSearch,
  onSourceSelect,
  searchResults,
  isLoading,
  categoryConfig,
  selectedSources,
  selectedDocumentIds
}) => {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [timeFilter, setTimeFilter] = useState('Any');
  const [showFilters, setShowFilters] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const { showToast } = useToast();
  const { searchQuery } = useSession();

  // Use searchQuery from session when available
  useEffect(() => {
    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setCurrentPage(1); // Reset to first page on new search
      onSearch(query, { 
        maxResults, 
        timeFilter, 
        excludedDomains: excludedDomains.length > 0 ? excludedDomains : undefined 
      });
    }
  };

  const handleSourceSelect = (url: string) => {
    const newSelectedSources = selectedSources.includes(url) 
      ? selectedSources.filter(source => source !== url)
      : [...selectedSources, url];
    
    onSourceSelect(newSelectedSources, selectedDocumentIds);
  };

  const handleSelectAll = () => {
    const allUrls = currentPageResults.map(result => result.url);
    const newSelectedSources = selectedSources.length === currentPageResults.length 
      ? [] 
      : allUrls;
      
    onSourceSelect(newSelectedSources, selectedDocumentIds);
  };

  const handleDocumentSelect = (documentIds: number[]) => {
    onSourceSelect(selectedSources, documentIds);
  };

  const addExcludedDomain = () => {
    if (newDomain && !excludedDomains.includes(newDomain)) {
      setExcludedDomains([...excludedDomains, newDomain]);
      setNewDomain('');
      showToast({ 
        type: 'info', 
        message: `Domain "${newDomain}" will be excluded from future searches.` 
      });
    }
  };

  const removeExcludedDomain = (domain: string) => {
    setExcludedDomains(excludedDomains.filter(d => d !== domain));
    showToast({ 
      type: 'info', 
      message: `Domain "${domain}" will no longer be excluded.` 
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, searchResults.length);
  const currentPageResults = searchResults.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-black backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-indigo-900/20">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-indigo-400" />
          {categoryConfig.name}
        </h2>
        
        {categoryConfig.searchInstructions && showTip && (
          <div className={`mb-4 p-3 rounded-lg flex items-start border ${
            `bg-${categoryConfig.color}-50 border-${categoryConfig.color}-200 text-${categoryConfig.color}-700 dark:bg-${categoryConfig.color}-900/20 dark:border-${categoryConfig.color}-800 dark:text-${categoryConfig.color}-700`
          }`}>
            <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{categoryConfig.searchInstructions}</p>
            </div>
            <button 
              onClick={() => setShowTip(false)}
              className="text-sm ml-2 opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Enter your ${categoryConfig.name.toLowerCase()} topic...`}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
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
              className="md:w-auto px-4 py-3 bg-gray-200 dark:bg-black text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors flex items-center justify-center border border-gray-300 dark:border-gray-600"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={`md:w-auto px-6 py-3 bg-${categoryConfig.color}-600 text-white rounded-lg hover:bg-${categoryConfig.color}-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Results
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">1</span>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={maxResults}
                      onChange={(e) => setMaxResults(Number(e.target.value))}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-indigo-500"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">20</span>
                  </div>
                  <div className="text-center text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {maxResults} results
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Time Filter
                  </label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white"
                  >
                    {['Any', 'Past 24 hours', 'Past week', 'Past month', 'Past year'].map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Excluded Domains Section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exclude Domains
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addExcludedDomain}
                    disabled={!newDomain.trim()}
                    className="px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </button>
                </div>
                
                {excludedDomains.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {excludedDomains.map((domain) => (
                      <div key={domain} className="flex items-center bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        <span className="mr-1">{domain}</span>
                        <button
                          type="button"
                          onClick={() => removeExcludedDomain(domain)}
                          className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <MinusCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-black rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Search Results {searchResults.length > 0 && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({startIndex + 1}-{endIndex} of {searchResults.length})</span>}
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {selectedSources.length === currentPageResults.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="space-y-4">
            {currentPageResults.map((result) => (
              <div key={result.url} className="flex items-start">
                <input
                  type="checkbox"
                  id={`source-${result.url}`}
                  checked={selectedSources.includes(result.url)}
                  onChange={() => handleSourceSelect(result.url)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <label htmlFor={`source-${result.url}`} className="cursor-pointer">
                    <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                      </a>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{result.snippet}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.url}</p>
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 dark:bg-blue-700 text-white font-medium'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}
          
          {/* Document Selector */}
          <DocumentSelector 
            selectedDocumentIds={selectedDocumentIds}
            onDocumentSelect={handleDocumentSelect}
          />
        </div>
      )}
    </div>
  );
};

export default SearchSection; 