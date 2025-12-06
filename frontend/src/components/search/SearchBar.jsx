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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search users and hashtags..."
          className="w-full pl-10 pr-10 py-2 surface-700 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover-accent"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (query || results.users.length > 0 || results.hashtags.length > 0) && (
        <div className="absolute top-full mt-2 w-full card-premium rounded-2xl max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : (
            <>
              {/* Users */}
              {results.users.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Users</p>
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.username}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:surface-700 rounded-lg transition-colors"
                    >
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full ring-2 ring-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Hashtags */}
              {results.hashtags.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hashtags</p>
                  {results.hashtags.map((hashtag) => (
                    <Link
                      key={hashtag.tag}
                      to={`/hashtag/${hashtag.tag}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2 hover:surface-700 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm text-foreground">#{hashtag.tag}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{hashtag.count} posts</p>
                    </Link>
                  ))}
                </div>
              )}

              {/* No Results */}
              {results.users.length === 0 && results.hashtags.length === 0 && query && (
                <div className="p-4 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}

              {/* See All Results */}
              {(results.users.length > 0 || results.hashtags.length > 0) && (
                <Link
                  to={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-center text-sm font-medium text-primary hover:surface-700 border-t border-border transition-colors"
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