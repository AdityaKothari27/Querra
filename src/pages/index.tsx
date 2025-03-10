import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import SearchSection from '../components/SearchSection';
import ReportSection from '../components/ReportSection';
import CategorySelector from '../components/CategorySelector';
import { SearchResult, SearchConfig } from '../types';
import { searchWeb } from '../lib/api';
import { getCategoryById } from '../config/categories';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  
  const handleSearch = async (query: string, config: SearchConfig) => {
    setIsLoading(true);
    setSearchQuery(query);
    try {
      // Add the category to the search config
      const categoryConfig = {
        ...config,
        category: selectedCategory
      };
      const results = await searchWeb(query, categoryConfig);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSelect = (sources: string[]) => {
    setSelectedSources(sources);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset search results when changing categories
    setSearchResults([]);
    setSelectedSources([]);
  };

  const categoryConfig = getCategoryById(selectedCategory);

  return (
    <Layout>
      <Head>
        <title>Deep Search - AI-Powered Research Assistant</title>
        <meta name="description" content="Conduct deep research with AI assistance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="space-y-8">
        <CategorySelector 
          selectedCategory={selectedCategory} 
          onCategorySelect={handleCategorySelect} 
        />
        
        <SearchSection 
          onSearch={handleSearch} 
          onSourceSelect={handleSourceSelect}
          searchResults={searchResults}
          isLoading={isLoading}
          categoryConfig={categoryConfig}
        />
        
        {selectedSources.length > 0 && (
          <ReportSection 
            selectedSources={selectedSources} 
            searchQuery={searchQuery}
            categoryConfig={categoryConfig}
          />
        )}
      </div>
    </Layout>
  );
} 