import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, User, Hash, Loader2 } from 'lucide-react';
import { usersAPI, hashtagsAPI } from '../lib/api';
import FollowButton from '../components/follow/FollowButton';
import AppLayout from '../components/layout/AppLayout';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 20;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (query) {
      // Reset state when query changes
      setUsers([]);
      setHashtags([]);
      setSkip(0);
      setHasMore(true);
      performSearch(false);
    }
  }, [query]);

  useEffect(() => {
    // Reset when switching tabs
    if (activeTab === 'users') {
      setSkip(0);
      setHasMore(true);
    }
  }, [activeTab]);

  const performSearch = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentSkip = isLoadMore ? skip : 0;

      if (activeTab === 'users') {
        const usersResponse = await usersAPI.search(query);
        const allUsers = usersResponse.data;
        
        // Implement client-side pagination
        const paginatedUsers = allUsers.slice(currentSkip, currentSkip + LIMIT);
        
        if (isLoadMore) {
          setUsers(prev => [...prev, ...paginatedUsers]);
        } else {
          setUsers(paginatedUsers);
        }
        
        setSkip(currentSkip + paginatedUsers.length);
        setHasMore(currentSkip + paginatedUsers.length < allUsers.length);
      } else {
        const hashtagsResponse = await hashtagsAPI.getTrending(100);
        const filteredHashtags = hashtagsResponse.data.filter(h => 
          h.tag.toLowerCase().includes(query.toLowerCase())
        );
        
        // Implement client-side pagination for hashtags
        const paginatedHashtags = filteredHashtags.slice(currentSkip, currentSkip + LIMIT);
        
        if (isLoadMore) {
          setHashtags(prev => [...prev, ...paginatedHashtags]);
        } else {
          setHashtags(paginatedHashtags);
        }
        
        setSkip(currentSkip + paginatedHashtags.length);
        setHasMore(currentSkip + paginatedHashtags.length < filteredHashtags.length);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      performSearch(true);
    }
  }, [loadingMore, hasMore, skip, activeTab, query]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
            <h1 className="text-xl font-bold">
              Search results for "{query}"
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b dark:border-gray-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-3 min-h-[44px] font-semibold transition-colors relative touch-manipulation ${
                activeTab === 'users'
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Users ({users.length})
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('hashtags')}
              className={`pb-3 px-3 min-h-[44px] font-semibold transition-colors relative touch-manipulation ${
                activeTab === 'hashtags'
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Hashtags ({hashtags.length})
              {activeTab === 'hashtags' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t" />
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-900">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-500">Searching...</p>
            </div>
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="divide-y dark:divide-gray-800">
                  {results.users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    results.users.map((user) => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Link
                          to={`/profile/${user.username}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{user.username}</p>
                            {user.bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.bio}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {user.followers_count} followers · {user.following_count} following
                            </p>
                          </div>
                        </Link>
                        {user.id !== currentUser.id && (
                          <FollowButton
                            userId={user.id}
                            initialIsFollowing={user.is_following}
                            size="sm"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Hashtags Tab */}
              {activeTab === 'hashtags' && (
                <div className="divide-y dark:divide-gray-800">
                  {results.hashtags.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hashtags found</p>
                    </div>
                  ) : (
                    results.hashtags.map((hashtag) => (
                      <Link
                        key={hashtag.tag}
                        to={`/hashtag/${hashtag.tag}`}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-lg">#{hashtag.tag}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {hashtag.count} {hashtag.count === 1 ? 'post' : 'posts'}
                          </p>
                        </div>
                        <Hash className="w-6 h-6 text-gray-400" />
                      </Link>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default SearchResults;