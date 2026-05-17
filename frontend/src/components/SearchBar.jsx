import { useState } from 'react';

const SearchBar = ({ onSearch, onClose, totalMessages }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = onSearch(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    onSearch('');
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-2 text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-600">
          {searchResults.length > 0 ? (
            <span>
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>No results found</span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
