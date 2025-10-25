// src/pages/RegisterPageUpdated.tsx - WITH PHONE & OCCUPATION
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock, Briefcase } from 'lucide-react';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format'),
  occupation_id: z.string().min(1, 'Please select your occupation'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Occupation {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
}

export const RegisterPageUpdated = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Fetch occupations on mount
  useEffect(() => {
    fetchOccupations();
  }, []);

  const fetchOccupations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_occupations')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setOccupations(data || []);
    } catch (error) {
      console.error('Error fetching occupations:', error);
      toast.error('Failed to load occupation options');
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      console.log('🔐 Starting registration...');

      // 1. Auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
          }
        }
      });

      if (authError) throw authError;

      console.log('✅ Auth successful, creating profile...');

      // 2. Create user profile with all fields
      if (authData.user) {
        const userProfile = {
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          occupation_id: data.occupation_id,
          password_hash: 'supabase_auth', // Required field
          is_active: true,
          last_login_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('users')
          .insert(userProfile);

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        console.log('✅ Profile created successfully');
      }

      toast.success('Registration successful! Please login.');
      navigate('/login');

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      let userMessage = error.message;
      if (error.message.includes('already registered')) {
        userMessage = 'Email already registered. Please login instead.';
      }
      
      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🚽</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">WC Check</h1>
          <p className="text-blue-100">Create your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('full_name')}
                  type="text"
                  placeholder="John Doe"
                  className={`
                    w-full pl-11 pr-4 py-3 border rounded-xl
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.full_name ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  className={`
                    w-full pl-11 pr-4 py-3 border rounded-xl
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.email ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+62 812-3456-7890"
                  className={`
                    w-full pl-11 pr-4 py-3 border rounded-xl
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.phone ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation / Job Title
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  {...register('occupation_id')}
                  className={`
                    w-full pl-11 pr-4 py-3 border rounded-xl appearance-none
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.occupation_id ? 'border-red-500' : 'border-gray-300'}
                  `}
                >
                  <option value="">Select your occupation...</option>
                  {occupations.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.icon} {occ.display_name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.occupation_id && (
                <p className="mt-1 text-sm text-red-600">{errors.occupation_id.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`
                    w-full pl-11 pr-11 py-3 border rounded-xl
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.password ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`
                    w-full pl-11 pr-11 py-3 border rounded-xl
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3 px-4 
                bg-gradient-to-r from-blue-600 to-blue-500
                text-white font-semibold rounded-xl
                hover:from-blue-700 hover:to-blue-600
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-lg hover:shadow-xl
              "
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-blue-100 text-sm mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};