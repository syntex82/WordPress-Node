/**
 * Blog Post Viewer Page
 * Displays a single blog post with full content, author info, and related articles
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postsApi, recommendationsApi, RecommendationItem } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import { useAuthStore } from '../stores/authStore';
import {
  FiArrowLeft, FiCalendar, FiUser, FiTag, FiClock, FiShare2,
  FiHeart, FiMessageCircle, FiBookmark, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: { id: string; name: string; slug: string }[];
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    const loadPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postsApi.getBySlug(slug);
        setPost(res.data);
        
        // Load related posts
        try {
          const relatedRes = await recommendationsApi.getRelatedPosts(res.data.id, 4);
          setRelatedPosts(relatedRes.data?.items || []);
        } catch {
          // Ignore related posts error
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Post not found');
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
        <p className="text-slate-500 mb-6">{error || 'The post you are looking for does not exist.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          Go Back
        </button>
      </div>
    );
  }

  const readingTime = Math.ceil((post.content?.length || 0) / 1000);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
              <FiShare2 className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
            </button>
            <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
              <FiBookmark className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img src={post.featuredImage} alt={post.title} className="w-full h-auto max-h-[500px] object-cover" />
          </div>
        )}

        {/* Category */}
        {post.category && (
          <Link to={`/category/${post.category.slug}`} className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium mb-4 hover:bg-blue-500/30">
            {post.category.name}
          </Link>
        )}

        {/* Title */}
        <h1 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {post.author && (
            <Link to={`/u/${post.author.id}`} className="flex items-center gap-3">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <FiUser className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.author.name}</p>
                {post.author.headline && <p className="text-sm text-slate-500">{post.author.headline}</p>}
              </div>
            </Link>
          )}
          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>•</span>
          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <FiCalendar className="w-4 h-4" />
            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>•</span>
          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <FiClock className="w-4 h-4" />
            {readingTime} min read
          </div>
        </div>

        {/* Content */}
        <div
          className={`prose prose-lg max-w-none ${isDark ? 'prose-invert' : ''}`}
          style={isDark ? { color: '#e2e8f0' } : undefined}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {isDark && (
          <style>{`
            .prose-invert p, .prose-invert li, .prose-invert span { color: #cbd5e1 !important; }
            .prose-invert h1, .prose-invert h2, .prose-invert h3, .prose-invert h4, .prose-invert h5, .prose-invert h6 { color: #fff !important; }
            .prose-invert strong, .prose-invert b { color: #fff !important; }
            .prose-invert a { color: #60a5fa !important; }
            .prose-invert code { color: #f472b6 !important; }
            .prose-invert blockquote { color: #94a3b8 !important; border-left-color: #475569 !important; }
          `}</style>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              <FiTag className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
              {post.tags.map(tag => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.slug}`}
                  className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map(related => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className={`group rounded-xl overflow-hidden ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-slate-700/50' : 'border-gray-200'} transition-colors`}
                >
                  {related.image && (
                    <div className="h-40 overflow-hidden">
                      <img src={related.image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className={`font-semibold line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{related.title}</h4>
                    {related.author && (
                      <p className="text-sm text-slate-500 mt-2">By {related.author.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

