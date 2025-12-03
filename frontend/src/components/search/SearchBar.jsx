import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { usersAPI, hashtagsAPI } from '../../lib/api';
import { Link, useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], hashtags: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults({ users: [], hashtags: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const [usersResponse, hashtagsResponse] = await Promise.all([
        usersAPI.search(searchQuery),
        hashtagsAPI.getTrending(5)
      ]);

      const filteredHashtags = hashtagsResponse.data.filter(h => 
        h.tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults({
        users: usersResponse.data.slice(0, 5),
        hashtags: filteredHashtags.slice(0, 5)
      });
      setIsOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ users: [], hashtags: [] });
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search users and hashtags..."
          className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (query || results.users.length > 0 || results.hashtags.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-800 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : (
            <>
              {/* Users */}
              {results.users.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Users</p>
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.username}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Hashtags */}
              {results.hashtags.length > 0 && (
                <div className="p-2 border-t dark:border-gray-800">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hashtags</p>
                  {results.hashtags.map((hashtag) => (
                    <Link
                      key={hashtag.tag}
                      to={`/hashtag/${hashtag.tag}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm">#{hashtag.tag}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{hashtag.count} posts</p>
                    </Link>
                  ))}
                </div>
              )}

              {/* No Results */}
              {results.users.length === 0 && results.hashtags.length === 0 && query && (
                <div className="p-4 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}

              {/* See All Results */}
              {(results.users.length > 0 || results.hashtags.length > 0) && (
                <Link
                  to={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-center text-sm font-medium text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-800 border-t dark:border-gray-800"
                >
                  See all results for "{query}"
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;