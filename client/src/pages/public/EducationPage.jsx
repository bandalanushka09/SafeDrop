import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../../services/articleService';
import { BookOpen, Search, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const EducationPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await articleService.getAll({
        category: selectedCategory,
        search,
      });
      if (res.success) {
        setArticles(res.data);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArticles();
  };

  const categories = [
    { id: '', label: 'All Topics' },
    { id: 'cholera', label: 'Cholera' },
    { id: 'typhoid', label: 'Typhoid Fever' },
    { id: 'diarrheal_illness', label: 'Diarrheal Diseases' },
    { id: 'water_storage', label: 'Safe Storage' },
    { id: 'water_treatment', label: 'Water Treatment' },
    { id: 'hygiene', label: 'Hygiene & Sanitation' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-surface-border p-6 sm:p-8 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-50 border border-brand-200 text-brand-800 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Public Health & Prevention Knowledge</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
          Disease Education Centre
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
          Evidence-based articles on preventing waterborne diseases, understanding transmission routes,
          household water treatment methods, and recognizing critical warning signs.
        </p>

        {/* Disclaimer alert */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-surface-border text-xs text-text-secondary">
          <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
          <span>
            These articles are educational and compiled from WHO and public-health manuals. They are not a substitute for professional clinical medical care.
          </span>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-brand-700 text-white'
                  : 'bg-white border border-surface-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-surface-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </form>
      </div>

      {/* Article Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg border border-surface-border p-8">
          <EmptyState
            icon={BookOpen}
            title="No Articles Found"
            message="No educational articles matched the selected topic or search term."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <div
              key={article._id}
              className="bg-white rounded-xl border border-surface-border p-6 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge status={article.category} size="xs" />
                  <span className="text-[11px] text-text-secondary">
                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {article.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between">
                <span className="text-[11px] text-text-secondary font-medium">
                  {article.references?.length ? `${article.references.length} References` : 'Public Health Review'}
                </span>
                <Link
                  to={`/education/${article.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EducationPage;

