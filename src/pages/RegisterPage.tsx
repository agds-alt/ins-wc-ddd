// src/pages/RegisterPage.tsx - FIXED

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Tables } from '../types/database.types';

// Type dari database
type Occupation = Tables<'user_occupations'>;

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  occupation_id: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loadingOccupations, setLoadingOccupations] = useState(true);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Fetch occupations
  useEffect(() => {
    const fetchOccupations = async () => {
      try {
        const { data, error } = await supabase
          .from('user_occupations')
          .select('*')
          .eq('is_active', true)
          .order('display_name');

        if (error) throw error;
        
        // Transform dengan default values
        setOccupations((data || []).map(occ => ({
          ...occ,
          icon: occ.icon || '👤',
          color: occ.color || '#3B82F6',
          description: occ.description || '',
        })));
      } catch (error) {
        console.error('Error fetching occupations:', error);
        setOccupations([]);
      } finally {
        setLoadingOccupations(false);
      }
    };

    fetchOccupations();
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    let userId: string | null = null;

    try {
      // 1. Auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      userId = authData.user.id;

      // 2. Create profile (occupation_id langsung di users table)
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          password_hash: 'supabase_auth',
          occupation_id: data.occupation_id || null,
          is_active: true,
          phone: null,
          profile_photo_url: null,
          last_login_at: null,
        });

      if (profileError) {
        // CRITICAL: Profile creation failed but auth user exists
        // Attempt cleanup by signing out the newly created user
        await supabase.auth.signOut();

        throw new Error(
          `Failed to create profile: ${profileError.message}\n` +
          'Your authentication account was created but profile setup failed. ' +
          'Please try registering again with the same email.'
        );
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');

    } catch (error: any) {
      console.error('Registration error:', error);

      let userMessage = error.message;

      // Handle specific error cases
      if (error.message.includes('password_hash')) {
        userMessage = 'Database configuration error. Please contact administrator.';
      } else if (error.message.includes('users_pkey')) {
        userMessage = 'User already exists with this email.';
      } else if (error.message.includes('User already registered')) {
        userMessage = 'This email is already registered. Please try logging in.';
      } else if (error.message.includes('Failed to create profile')) {
        // Use the detailed error message from above
        userMessage = error.message;
      }

      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 safe-area">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">🚽</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Sign up to start inspections</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              {...register('full_name')}
              type="text"
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Occupation */}
          <div>
            <label htmlFor="occupation_id" className="block text-sm font-medium text-gray-700">
              Occupation (Optional)
            </label>
            {loadingOccupations ? (
              <div className="mt-1 block w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-2xl">
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <select
                {...register('occupation_id')}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your occupation</option>
                {occupations.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.icon} {occ.display_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};