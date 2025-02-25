import { FC, useState } from 'react';
import { SearchResult, SearchConfig } from '../types';

interface SearchSectionProps {
  onSearch: (query: string, config: SearchConfig) => Promise<void>;
  onSourceSelect: (urls: string[]) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
}

const SearchSection: FC<SearchSectionProps> = ({
  onSearch,
  onSourceSelect,
  searchResults,
  isLoading
}) => {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [timeFilter, setTimeFilter] = useState('Any');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    await onSearch(query, { maxResults, timeFilter });
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedUrls = checked ? searchResults.map(result => result.url) : [];
    setSelectedUrls(newSelectedUrls);
    onSourceSelect(newSelectedUrls);
  };

  const handleSourceSelect = (url: string, isSelected: boolean) => {
    const newSelectedUrls = isSelected
      ? [...selectedUrls, url]
      : selectedUrls.filter(u => u !== url);
    setSelectedUrls(newSelectedUrls);
    onSourceSelect(newSelectedUrls);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Topic
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your research topic..."
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Results
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{maxResults} results</span>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Filter
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option>Any</option>
              <option>Past 24 hours</option>
              <option>Past week</option>
              <option>Past month</option>
              <option>Past year</option>
            </select>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedUrls.length === searchResults.length}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Select All Sources ({searchResults.length})
            </label>
          </div>
          
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div key={result.url} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedUrls.includes(result.url)}
                  onChange={(e) => handleSourceSelect(result.url, e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{result.title}</h3>
                  <p className="text-sm text-gray-500">{result.snippet}</p>
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    {result.url}
                  </a>
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