/**
 * Register Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success('Registration successful! Please login.');
      router.push('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="container-elevated">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Register</h1>
        <p className="text-muted-foreground">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="input-field"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-field"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Phone (Optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input-field"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-field"
            placeholder="Enter your password (min 8 characters)"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="btn-primary w-full"
        >
          {registerMutation.isPending ? (
            <span className="flex items-center justify-center">
              <span className="spinner mr-2" />
              Registering...
            </span>
          ) : (
            'Register'
          )}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-foreground hover:underline">
            Login here
          </a>
        </div>
      </form>
    </div>
  );
}
