// src/pages/TestPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const TestPage = () => {
  const [isTesting, setIsTesting] = useState(false);

  const testDatabaseInsert = async () => {
    setIsTesting(true);
    try {
      const testUser = {
        id: 'test-' + Date.now(),
        email: 'test_' + Date.now() + '@toiletcheck.com',
        full_name: 'Test User ' + Date.now(),
        password_hash: 'test_hash',
        is_active: true,
      };

      console.log('Attempting insert:', testUser);

      const { data, error } = await supabase
        .from('users')
        .insert(testUser)
        .select();

      if (error) {
        console.error('❌ Insert failed:', error);
        toast.error('Insert failed: ' + error.message);
      } else {
        console.log('✅ Insert successful:', data);
        toast.success('Database insert successful!');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error('Test failed: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Database Test</h1>
        <button
          onClick={testDatabaseInsert}
          disabled={isTesting}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Database Insert'}
        </button>
      </div>
    </div>
  );
};