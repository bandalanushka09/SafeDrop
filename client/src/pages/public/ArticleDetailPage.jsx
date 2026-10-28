import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articleService } from '../../services/articleService';
import {
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

export const ArticleDetailPage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await articleService.getBySlug(slug);
        if (res.success) {
          setArticle(res.data);
        }
      } catch (err) {
        setError(err.message || 'Educational article not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-lg bg-red-50 text-status-danger text-sm border border-red-200">
          {error || 'Article not found'}
        </div>
        <Link
          to="/education"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Disease Education Centre</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Back button */}
      <div>
        <Link
          to="/education"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>
      </div>

      {/* Title & Metadata Header */}
      <header className="space-y-4 pb-6 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Badge status={article.category} size="sm" />
          <span className="text-xs text-text-secondary">Language: {article.language?.toUpperCase()}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary leading-tight">
          {article.title}
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed font-medium">
          {article.summary}
        </p>

        <div className="flex items-center gap-4 text-xs text-text-secondary pt-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Published: {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
          </span>
          {article.reviewedBy && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Reviewed by: {article.reviewedBy.name} ({article.reviewedBy.role?.replace('_', ' ')})
            </span>
          )}
        </div>
      </header>

      {/* Main Narrative Content */}
      <section className="prose prose-sm max-w-none text-text-primary space-y-4 text-sm leading-relaxed whitespace-pre-line">
        {article.content}
      </section>

      {/* Transmission Information Box */}
      {article.transmissionInfo && (
        <section className="bg-slate-50 border border-surface-border rounded-lg p-5 space-y-2">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-status-warning" />
            <span>Transmission Pathways</span>
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
            {article.transmissionInfo}
          </p>
        </section>
      )}

      {/* Prevention Guidance Box */}
      {article.preventionGuidance && (
        <section className="bg-teal-50/50 border border-brand-200 rounded-lg p-5 space-y-2">
          <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-700" />
            <span>Community & Household Prevention Practices</span>
          </h3>
          <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">
            {article.preventionGuidance}
          </p>
        </section>
      )}

      {/* Warning Signs Box */}
      {article.warningSigns && (
        <section className="bg-red-50/60 border border-red-200 rounded-lg p-5 space-y-2">
          <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-status-danger" />
            <span>When to Seek Immediate Medical Attention</span>
          </h3>
          <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">
            {article.warningSigns}
          </p>
        </section>
      )}

      {/* References & Citations */}
      {article.references && article.references.length > 0 && (
        <section className="pt-6 border-t border-surface-border space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Public Health References & Citations
          </h4>
          <ul className="space-y-1.5 text-xs text-text-secondary list-disc pl-5">
            {article.references.map((ref, idx) => (
              <li key={idx} className="leading-relaxed">
                {ref}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Medical Disclaimer Callout */}
      <div className="p-4 rounded-lg bg-slate-100 border border-surface-border text-xs text-text-secondary flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Notice:</strong> This guide provides general public-health education. It does not replace individual medical assessment, diagnosis, or treatment. Always follow official recommendations from your local health authority.
        </p>
      </div>
    </article>
  );
};

export default ArticleDetailPage;

