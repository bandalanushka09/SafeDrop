import React, { useState, useEffect } from 'react';
import { articleService } from '../../services/articleService';
import { useToast } from '../../context/ToastContext';
import { FileText, PlusCircle, Edit2, Archive, Eye } from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';

export const ArticleManagementPage = () => {
  const { showToast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'general',
    language: 'en',
    transmissionInfo: '',
    preventionGuidance: '',
    warningSigns: '',
    references: '',
    status: 'published',
  });
  const [saving, setSaving] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await articleService.getAll({ status: '' });
      if (res.success) setArticles(res.data);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: 'general',
      language: 'en',
      transmissionInfo: '',
      preventionGuidance: '',
      warningSigns: '',
      references: '',
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setFormData({
      title: art.title,
      summary: art.summary,
      content: art.content,
      category: art.category,
      language: art.language || 'en',
      transmissionInfo: art.transmissionInfo || '',
      preventionGuidance: art.preventionGuidance || '',
      warningSigns: art.warningSigns || '',
      references: Array.isArray(art.references) ? art.references.join('\n') : '',
      status: art.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        references: formData.references
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
      };

      if (editingArticle) {
        await articleService.update(editingArticle._id, payload);
        showToast('Article updated successfully.');
      } else {
        await articleService.create(payload);
        showToast('Article created successfully.');
      }
      setIsModalOpen(false);
      fetchArticles();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Article Title',
      accessor: 'title',
      cell: (row) => (
        <div>
          <span className="font-semibold text-text-primary block">{row.title}</span>
          <span className="text-[11px] text-text-secondary truncate max-w-xs block">
            {row.summary}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => <Badge status={row.category} size="xs" />,
    },
    {
      header: 'Language',
      accessor: 'language',
      cell: (row) => <span className="text-xs uppercase font-mono">{row.language}</span>,
    },
    {
      header: 'Publication Status',
      accessor: 'status',
      cell: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)} icon={Edit2}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Disease Education Content</h1>
          <p className="text-xs text-text-secondary mt-1">
            Author and publish peer-reviewed public health guides on waterborne pathogens and safe water hygiene.
          </p>
        </div>

        <Button variant="primary" icon={PlusCircle} onClick={handleOpenCreate}>
          New Educational Article
        </Button>
      </div>

      <Table
        columns={columns}
        data={articles}
        loading={loading}
        emptyMessage="No educational articles found."
      />

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingArticle ? `Edit Article: ${editingArticle.title}` : 'Create Educational Article'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveArticle} className="space-y-4">
            <Input
              label="Article Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Topic Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder=""
                options={[
                  { value: 'cholera', label: 'Cholera' },
                  { value: 'typhoid', label: 'Typhoid Fever' },
                  { value: 'diarrheal_illness', label: 'Diarrheal Illnesses' },
                  { value: 'water_storage', label: 'Household Storage' },
                  { value: 'water_treatment', label: 'Water Treatment' },
                  { value: 'hygiene', label: 'Hygiene & Sanitation' },
                  { value: 'general', label: 'General Health' },
                ]}
                required
              />

              <Select
                label="Language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder=""
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'Hindi' },
                  { value: 'mr', label: 'Marathi' },
                  { value: 'es', label: 'Spanish' },
                ]}
                required
              />

              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder=""
                options={[
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
                required
              />
            </div>

            <Textarea
              label="Executive Summary (Short overview)"
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              required
            />

            <Textarea
              label="Main Narrative Content"
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />

            <Textarea
              label="Transmission Pathways"
              rows={2}
              value={formData.transmissionInfo}
              onChange={(e) => setFormData({ ...formData, transmissionInfo: e.target.value })}
            />

            <Textarea
              label="Actionable Prevention Guidance"
              rows={2}
              value={formData.preventionGuidance}
              onChange={(e) => setFormData({ ...formData, preventionGuidance: e.target.value })}
            />

            <Textarea
              label="Emergency Warning Signs (Hospital Red Flags)"
              rows={2}
              value={formData.warningSigns}
              onChange={(e) => setFormData({ ...formData, warningSigns: e.target.value })}
            />

            <Textarea
              label="References & Citations (One per line)"
              rows={2}
              value={formData.references}
              onChange={(e) => setFormData({ ...formData, references: e.target.value })}
              placeholder="e.g. World Health Organization (WHO) Water Safety Guidelines&#10;UNICEF Sanitation Protocol"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editingArticle ? 'Update Article' : 'Publish Article'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ArticleManagementPage;

