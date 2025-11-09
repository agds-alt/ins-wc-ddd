// src/pages/admin/OccupationManagerPage.tsx - Admin page untuk manage occupations
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '../../components/ui/Card';

interface Occupation {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
}

type OccupationForm = Omit<Occupation, 'id' | 'is_active'>;

export const OccupationManagerPage = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OccupationForm>({
    name: '',
    display_name: '',
    icon: '💼',
    color: '#6B7280',
    description: ''
  });

  // Fetch occupations
  const { data: occupations, isLoading } = useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_occupations')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as Occupation[];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: OccupationForm) => {
      const { error } = await supabase
        .from('user_occupations')
        .insert({
          ...data,
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      toast.success('Occupation added successfully!');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to add: ${error.message}`);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OccupationForm }) => {
      const { error } = await supabase
        .from('user_occupations')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      toast.success('Occupation updated successfully!');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('user_occupations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      toast.success('Occupation deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      icon: '💼',
      color: '#6B7280',
      description: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.display_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (occupation: Occupation) => {
    setFormData({
      name: occupation.name,
      display_name: occupation.display_name,
      icon: occupation.icon,
      color: occupation.color,
      description: occupation.description || ''
    });
    setEditingId(occupation.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this occupation?')) {
      deleteMutation.mutate(id);
    }
  };

  // Common emoji options
  const emojiOptions = ['💼', '🧹', '👨‍⚕️', '👩‍⚕️', '👤', '⚙️', '👔', '🏥', '🔧', '📋'];
  
  // Common color options
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#6B7280', // Gray
    '#EC4899', // Pink
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Occupation Management</h1>
          <p className="text-gray-600">Manage user occupation types</p>
        </div>

        {/* Add Button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mb-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Occupation</span>
          </button>
        )}

        {/* Form */}
        {isAdding && (
          <Card className="mb-6">
            <CardHeader 
              title={editingId ? 'Edit Occupation' : 'Add New Occupation'}
              icon={<Briefcase className="w-5 h-5 text-blue-600" />}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (slug) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (slug) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., cleaning_staff"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, use underscore for spaces</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Cleaning Staff"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="💼"
                    className="w-20 px-4 py-2 border border-gray-300 rounded-xl text-center text-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">or choose:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`
                        w-12 h-12 rounded-xl text-2xl hover:bg-gray-100 transition-colors
                        ${formData.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white border border-gray-200'}
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6B7280"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`
                        w-12 h-12 rounded-xl transition-transform hover:scale-110
                        ${formData.color === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''}
                      `}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this occupation..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingId ? 'Update' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* List */}
        <Card>
          <CardHeader 
            title="All Occupations"
            subtitle={`${occupations?.filter(o => o.is_active).length || 0} active occupations`}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
          />

          <div className="space-y-2">
            {occupations?.map((occupation) => (
              <div
                key={occupation.id}
                className={`
                  flex items-center gap-4 p-4 rounded-xl transition-all
                  ${occupation.is_active ? 'bg-gray-50 hover:bg-gray-100' : 'bg-red-50 opacity-60'}
                `}
              >
                {/* Icon & Color Preview */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl"
                  style={{ backgroundColor: occupation.color }}
                >
                  {occupation.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{occupation.display_name}</div>
                  <div className="text-sm text-gray-500">{occupation.name}</div>
                  {occupation.description && (
                    <div className="text-xs text-gray-400 mt-1 truncate">{occupation.description}</div>
                  )}
                  {!occupation.is_active && (
                    <span className="text-xs text-red-600 font-medium">Deleted</span>
                  )}
                </div>

                {/* Actions */}
                {occupation.is_active && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(occupation)}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(occupation.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!occupations?.length && (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No occupations yet. Add your first one!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};