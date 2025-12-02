import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hashtagsAPI } from '../../lib/api';
import { Hash, TrendingUp } from 'lucide-react';

export default function TrendingSection() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const response = await hashtagsAPI.getTrending(5);
        setTrending(response.data);
      } catch (error) {
        console.error('Failed to load trending hashtags:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="font-heading font-bold text-lg mb-4">Trending</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trending.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trending
        </h3>
        <p className="text-sm text-muted-foreground">No trending hashtags yet</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Trending
      </h3>
      <div className="space-y-4">
        {trending.map((item, i) => (
          <Link 
            key={i} 
            to={`/hashtag/${item.tag}`}
            className="flex justify-between items-start group cursor-pointer"
          >
            <div>
              <p className="text-xs text-muted-foreground">Trending #{i + 1}</p>
              <p className="font-semibold group-hover:text-primary transition-colors flex items-center gap-1">
                <Hash className="w-4 h-4" />
                {item.tag}
              </p>
              <p className="text-xs text-muted-foreground">{item.count} {item.count === 1 ? 'post' : 'posts'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
