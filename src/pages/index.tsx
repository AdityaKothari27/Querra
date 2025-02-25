import { FC, useState } from 'react';
import Layout from '../components/Layout';
import SearchSection from '../components/SearchSection';
import ReportSection from '../components/ReportSection';
import { searchTopics } from '../lib/api';
import { SearchResult, SearchConfig } from '../types';

const HomePage: FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query: string, config: SearchConfig) => {
    setIsLoading(true);
    setSearchQuery(query);
    try {
      const results = await searchTopics(query, config);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <SearchSection
          onSearch={handleSearch}
          onSourceSelect={setSelectedSources}
          searchResults={searchResults}
          isLoading={isLoading}
        />
        <ReportSection 
          selectedSources={selectedSources}
          searchQuery={searchQuery}
        />
      </div>
    </Layout>
  );
};

export default HomePage; 