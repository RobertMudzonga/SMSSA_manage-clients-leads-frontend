import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FileText, Eye } from 'lucide-react';
import TemplateEditorModal from './TemplateEditorModal';
import TemplatePreviewModal from './TemplatePreviewModal';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  created_at: string;
}

export default function TemplateLibraryView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleSaveTemplate = async (template: any) => {
    try {
      if (template.id) {
        const { error } = await supabase
          .from('document_templates')
          .update({
            name: template.name,
            description: template.description,
            category: template.category,
            content: template.content,
            variables: template.variables,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('document_templates')
          .insert([{
            name: template.name,
            description: template.description,
            category: template.category,
            content: template.content,
            variables: template.variables
          }]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      loadTemplates();
      setIsEditorOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const seedTemplates = async () => {
    try {
      const { error } = await supabase.functions.invoke('seed-document-templates');
      if (error) throw error;
      toast.success('Sample templates added successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error seeding templates:', error);
      toast.error('Failed to seed templates');
    }
  };

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Template Library</h1>
          <p className="text-gray-600">Create and manage reusable document templates</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button onClick={seedTemplates} variant="outline">
              Load Sample Templates
            </Button>
          )}
          <Button onClick={() => { setEditingTemplate(null); setIsEditorOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <Badge variant="secondary">{template.category}</Badge>
              </div>
            </div>
            <h3 className="font-semibold mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {template.variables.slice(0, 3).map(v => (
                <span key={v} className="text-xs bg-gray-100 px-2 py-1 rounded">{v}</span>
              ))}
              {template.variables.length > 3 && (
                <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setPreviewTemplate(template); setIsPreviewOpen(true); }}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Generate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingTemplate(template); setIsEditorOpen(true); }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteTemplate(template.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No templates found</p>
        </div>
      )}

      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setEditingTemplate(null); }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
      />

      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setPreviewTemplate(null); }}
        template={previewTemplate}
      />
    </div>
  );
}
