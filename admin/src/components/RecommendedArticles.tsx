/**
 * Recommended Articles Sidebar Component
 * Shows personalized/trending article recommendations
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recommendationsApi, RecommendationItem } from '../services/api';
import { FiBookOpen, FiClock, FiUser, FiTrendingUp, FiExternalLink } from 'react-icons/fi';

interface RecommendedArticlesProps {
  limit?: number;
  className?: string;
}

export default function RecommendedArticles({ limit = 5, className = '' }: RecommendedArticlesProps) {
  const [articles, setArticles] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState<string>('');

  useEffect(() => {
    loadRecommendations();
  }, [limit]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Try personalized first, fall back to trending/popular
      let res = await recommendationsApi.getPersonalizedPosts(limit);
      if (res.data?.items?.length > 0) {
        setArticles(res.data.items);
        setAlgorithm(res.data.algorithm);
      } else {
        // Fall back to trending
        res = await recommendationsApi.getTrendingPosts(limit, 7);
        if (res.data?.items?.length > 0) {
          setArticles(res.data.items);
          setAlgorithm('trending');
        } else {
          // Fall back to popular
          res = await recommendationsApi.getPopularPosts(limit);
          setArticles(res.data?.items || []);
          setAlgorithm('popular');
        }
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      // Try trending as fallback
      try {
        const res = await recommendationsApi.getTrendingPosts(limit, 7);
        setArticles(res.data?.items || []);
        setAlgorithm('trending');
      } catch {
        setArticles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/30 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-16 h-16 bg-slate-700 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null; // Don't show empty section
  }

  const getAlgorithmLabel = () => {
    switch (algorithm) {
      case 'personalized': return 'For You';
      case 'trending': return 'Trending';
      case 'popular': return 'Popular';
      default: return 'Recommended';
    }
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/30 hover:border-slate-600/50 transition-colors ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <FiBookOpen className="w-4 h-4 text-white" />
          </div>
          Recommended Articles
        </h3>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <FiTrendingUp className="w-3 h-3" />
          {getAlgorithmLabel()}
        </span>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/blog/${article.slug}`}
            className="group flex gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-700/50 transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
              {article.image ? (
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <FiBookOpen className="w-6 h-6 text-slate-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">
                {article.title}
              </h4>
              {article.metadata?.author && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <FiUser className="w-3 h-3" />
                  {article.metadata.author}
                </p>
              )}
            </div>

            {/* Hover indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
              <FiExternalLink className="w-4 h-4 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

