import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { naLogin, fetchNAMe } from '../../api';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, User as UserIcon, Loader2, Eye, EyeOff, Heart } from 'lucide-react';

const NALogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isNA, setIsNA] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkNA = async () => {
      const token = localStorage.getItem('na_token');
      if (token) {
        try {
          await fetchNAMe();
          setIsNA(true);
        } catch {
          localStorage.removeItem('na_token');
          setIsNA(false);
        }
      } else {
        setIsNA(false);
      }
    };
    checkNA();
  }, []);

  const mutation = useMutation({
    mutationFn: naLogin,
    onSuccess: (data) => {
      localStorage.setItem('na_token', data.token);
      localStorage.setItem('na_user', JSON.stringify(data.caregiver));
      navigate('/na');
    },
    onError: (err: any) => {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    },
  });

  if (isNA === true) {
    return <Navigate to="/na" />;
  }

  if (isNA === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-primary/10">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Healthy Nara</h1>
          <p className="text-gray-500 mt-2">NA ဝန်ထမ်း ဝင်ရောက်ရန်</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">အမည် (Username)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary text-sm transition-all"
                placeholder="username ထည့်ပါ"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">မှတ်ပုံတင်နံပါတ် (NRC)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary text-sm transition-all"
                placeholder="NRC ဂဏန်းများထည့်ပါ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-all rounded-r-xl"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-70"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin mr-2" />
            ) : null}
            ဝင်ရောက်ရန်
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>&copy; 2026 Healthy Nara. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default NALogin;
