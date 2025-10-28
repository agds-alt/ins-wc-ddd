// src/pages/admin/OrganizationsManager.tsx - CRUD for Organizations
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Tables, TablesInsert } from '../../types/database.types';
import { Plus, Edit2, Trash2, Search, MoreVertical, Building2, QrCode, Menu, ShieldAlert, User } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sidebar } from '../../components/mobile/Sidebar';
import { BottomNav } from '../../components/mobile/BottomNav';
import { z } from 'zod';

type Organization = Tables<'organizations'>;
type OrganizationInsert = TablesInsert<'organizations'>;

// Zod validation schema for organization
const organizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(255, 'Organization name is too long'),
  short_code: z.string()
    .min(1, 'Short code is required')
    .max(10, 'Short code must be 10 characters or less')
    .regex(/^[A-Z0-9\-_]+$/, 'Short code must contain only uppercase letters, numbers, hyphens, and underscores')
    .transform(val => val.toUpperCase()),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(500, 'Address is too long')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
});

export const OrganizationsManager = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<OrganizationInsert>>({
    name: '',
    short_code: '',
    address: '',
    email: '',
    phone: '',
    is_active: true,
  });

  // Fetch organizations
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
  });

  // Filter organizations
  const filteredOrgs = organizations?.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OrganizationInsert>) => {
      if (selectedOrg) {
        // Update
        const { error } = await supabase
          .from('organizations')
          .update(data)
          .eq('id', selectedOrg.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('organizations')
          .insert([{ ...data, created_by: user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(selectedOrg ? 'Organization updated' : 'Organization created');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      short_code: '',
      address: '',
      email: '',
      phone: '',
      is_active: true,
    });
    setSelectedOrg(null);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      short_code: org.short_code,
      address: org.address || '',
      email: org.email || '',
      phone: org.phone || '',
      is_active: org.is_active,
    });
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete organization "${name}"? This will affect all buildings and locations!`)) {
      deleteMutation.mutate(id);
      setOpenMenuId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data with Zod schema
    try {
      const validatedData = organizationSchema.parse(formData);
      saveMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show first validation error
        const firstError = error.errors[0];
        toast.error(firstError.message);
        console.error('Validation errors:', error.errors);
      } else {
        toast.error('Validation failed');
      }
    }
  };

  // Auth checks
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Admin Access Required</h2>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Clean White Style */}
      <div className="bg-white p-6 shadow-md border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}
              >
                Organizations
              </h1>
              <p className="text-gray-600 text-sm">Manage organizations & generate QR codes</p>
            </div>
          </div>

          {user && (
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 text-sm font-medium">
                {user.user_metadata?.name || user.email}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search & Actions */}
        <Card>
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <Button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Organization</span>
            </Button>
          </div>
        </Card>

        {/* Organizations List */}
        <div className="space-y-3">
          {filteredOrgs?.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No organizations found</p>
              </div>
            </Card>
          ) : (
            filteredOrgs?.map((org) => (
              <Card key={org.id} className="relative">
                <div className="pr-10">
                  {/* Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      🏢
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {org.short_code}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-sm text-gray-600 space-y-1 mb-2">
                    {org.email && <p className="truncate">📧 {org.email}</p>}
                    {org.phone && <p>📱 {org.phone}</p>}
                    {org.address && <p className="truncate">📍 {org.address}</p>}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        org.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {org.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                </div>

                {/* Menu Button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === org.id ? null : org.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === org.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-12 z-20 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[160px]">
                        <button
                          onClick={() => handleEdit(org)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedOrg ? 'Edit Organization' : 'Add Organization'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Code *
                </label>
                <input
                  type="text"
                  value={formData.short_code}
                  onChange={(e) => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ORG01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <BottomNav />
    </div>
  );
};
