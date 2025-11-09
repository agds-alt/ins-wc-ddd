/**
 * Login Page
 * Reuses existing LoginPage component
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success('Login successful!');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="container-elevated">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">WC Check</h1>
        <p className="text-muted-foreground">Toilet Inspection System</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="btn-primary w-full"
        >
          {loginMutation.isPending ? (
            <span className="flex items-center justify-center">
              <span className="spinner mr-2" />
              Logging in...
            </span>
          ) : (
            'Login'
          )}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/register" className="text-foreground hover:underline">
            Register here
          </a>
        </div>
      </form>
    </div>
  );
}
