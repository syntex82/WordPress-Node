/**
 * Browse Developers Page
 * Public page for clients to discover and hire developers
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiX, FiMapPin, FiStar,
  FiChevronLeft, FiChevronRight, FiUsers, FiAward,
  FiGrid, FiList, FiBriefcase
} from 'react-icons/fi';
import { developerMarketplaceApi, DeveloperProfile, DeveloperMarketplaceQuery } from '../../services/api';
import toast from 'react-hot-toast';

const experienceLevels = [
  { value: '', label: 'All Levels' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
];

const availabilityOptions = [
  { value: '', label: 'Any Availability' },
  { value: 'available', label: 'Available Now' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' },
];

const sortOptions = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'projects', label: 'Most Projects' },
  { value: 'newest', label: 'Newest' },
  { value: 'rate', label: 'Hourly Rate' },
];

export default function BrowseDevelopers() {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [featuredDevelopers, setFeaturedDevelopers] = useState<DeveloperProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState<DeveloperMarketplaceQuery>({
    page: 1,
    limit: 12,
    sortBy: 'rating',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [skills, setSkills] = useState<{ skill: string; count: number }[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchDevelopers();
  }, [query]);

  const loadInitialData = async () => {
    try {
      const [skillsRes, featuredRes] = await Promise.all([
        developerMarketplaceApi.getSkills(),
        developerMarketplaceApi.getFeatured(4),
      ]);
      setSkills(skillsRes.data);
      setFeaturedDevelopers(featuredRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const searchQuery = { ...query, skills: selectedSkills.length > 0 ? selectedSkills : undefined };
      const { data } = await developerMarketplaceApi.getDevelopers(searchQuery);
      setDevelopers(data.developers);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Error fetching developers:', error);
      toast.error('Failed to load developers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(prev => ({ ...prev, page: 1 }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setQuery({ page: 1, limit: 12, sortBy: 'rating', sortOrder: 'desc' });
    setSelectedSkills([]);
  };

  const DeveloperCard = ({ dev }: { dev: DeveloperProfile }) => (
    <Link
      to={`/u/${dev.username || dev.id}`}
      className="group bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
    >
      {/* Header with avatar */}
      <div className="relative p-4 sm:p-6 pb-0">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-600 group-hover:border-blue-500/50 transition-colors">
              {dev.avatar ? (
                <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-white">{dev.name.charAt(0)}</span>
                </div>
              )}
            </div>
            {dev.availability && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-slate-800 ${
                dev.availability === 'available' ? 'bg-emerald-500' :
                dev.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-500'
              }`} title={dev.availability} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate text-sm sm:text-base">
              {dev.name}
            </h3>
            {dev.headline && (
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-1 mt-0.5">{dev.headline}</p>
            )}
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 flex-wrap">
              {dev.rating && (
                <span className="flex items-center gap-1 text-xs sm:text-sm">
                  <FiStar className="text-amber-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-white font-medium">{dev.rating.toFixed(1)}</span>
                  {dev.reviewsCount && <span className="text-slate-500">({dev.reviewsCount})</span>}
                </span>
              )}
              {dev.location && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                  <FiMapPin className="w-3 h-3" />
                  <span className="truncate max-w-[80px] sm:max-w-[100px]">{dev.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Skills & Stats */}
      <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-700/50">
        {dev.skills && dev.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {dev.skills.slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full text-[10px] sm:text-xs">
                {skill}
              </span>
            ))}
            {dev.skills.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-700/50 text-slate-500 rounded-full text-[10px] sm:text-xs">
                +{dev.skills.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            {dev.completedProjects !== undefined && (
              <span className="flex items-center gap-1 text-slate-400">
                <FiBriefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                {dev.completedProjects} projects
              </span>
            )}
            {dev.certificatesCount > 0 && (
              <span className="flex items-center gap-1 text-slate-400">
                <FiAward className="w-3 h-3 sm:w-4 sm:h-4" />
                {dev.certificatesCount}
              </span>
            )}
          </div>
          {dev.hourlyRate && (
            <span className="text-white font-semibold text-sm sm:text-base">
              ${dev.hourlyRate}<span className="text-slate-500 text-xs sm:text-sm font-normal">/hr</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Find Developers
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Discover talented developers for your next project</p>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <FiGrid className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl border border-slate-700/50 p-4 sm:p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search developers by name, skills..."
              value={query.search || ''}
              onChange={(e) => setQuery(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-colors text-sm sm:text-base ${
                showFilters ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <FiFilter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm sm:text-base"
            >
              <FiSearch className="w-4 h-4" />
              Search
            </button>
          </div>
        </form>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <select
                value={query.experienceLevel || ''}
                onChange={(e) => setQuery(prev => ({ ...prev, experienceLevel: e.target.value, page: 1 }))}
                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {experienceLevels.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={query.availability || ''}
                onChange={(e) => setQuery(prev => ({ ...prev, availability: e.target.value, page: 1 }))}
                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {availabilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={query.sortBy || 'rating'}
                onChange={(e) => setQuery(prev => ({ ...prev, sortBy: e.target.value as any, page: 1 }))}
                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-600/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
              >
                <FiX className="w-4 h-4" />
                Clear
              </button>
            </div>

            {/* Skills Filter */}
            {skills.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Popular Skills</p>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 12).map(({ skill, count }) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:border-slate-500'
                      }`}
                    >
                      {skill} <span className="text-slate-500">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Featured Developers */}
      {featuredDevelopers.length > 0 && !query.search && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <FiStar className="text-amber-400" /> Featured Developers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredDevelopers.map(dev => (
              <DeveloperCard key={dev.id} dev={dev} />
            ))}
          </div>
        </div>
      )}

      {/* All Developers */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <FiUsers className="text-blue-400" /> All Developers
            <span className="text-sm font-normal text-slate-500">({pagination.total})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-blue-500"></div>
          </div>
        ) : developers.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl border border-slate-700/50 p-8 sm:p-12 text-center">
            <FiUsers className="mx-auto text-slate-600 mb-4 w-12 h-12 sm:w-16 sm:h-16" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No developers found</h3>
            <p className="text-slate-400 text-sm sm:text-base">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
          }>
            {developers.map(dev => (
              <DeveloperCard key={dev.id} dev={dev} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-4">
          <button
            onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
            disabled={pagination.page === 1}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-slate-400 text-sm sm:text-base">
            Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
          </span>
          <button
            onClick={() => setQuery(prev => ({ ...prev, page: Math.min(pagination.totalPages, (prev.page || 1) + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Next</span>
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

