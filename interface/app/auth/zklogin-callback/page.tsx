'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { computeZkAddress, clearZkLoginStorage, getProviderFromStorage } from '@/lib/zklogin-utils';

export default function ZkLoginCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setStatus('Extracting JWT token...');

      const provider = getProviderFromStorage() || 'google';

      // Google OAuth - токен в hash fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');

      console.log('JWT Token received:', idToken?.substring(0, 50) + '...');

      if (!idToken) {
        throw new Error('No JWT token received from Google');
      }

      setStatus('Computing zkLogin address...');

      // Декодируем JWT
      const jwtPayload = JSON.parse(atob(idToken.split('.')[1]));
      console.log('JWT Payload:', jwtPayload);
      console.log('Email:', jwtPayload.email);

      // Используем каноническую схему Sui zkLogin
      // Адрес детерминированный: один Google аккаунт = один адрес
      const zkAddress = await computeZkAddress(jwtPayload, provider);

      console.log('Generated zkLogin address:', zkAddress);

      // Сохраняем публичные данные в localStorage (безопасно)
      localStorage.setItem('zklogin_address', zkAddress);
      localStorage.setItem('zklogin_email', jwtPayload.email);
      localStorage.setItem('zklogin_provider', provider);

      // Сохраняем чувствительные данные в sessionStorage (только текущая вкладка)
      sessionStorage.setItem('zklogin_jwt', idToken);

      clearZkLoginStorage();

      // Отправляем событие для обновления UI
      window.dispatchEvent(new Event('zklogin-changed'));

      setStatus('Success! Redirecting...');

      // Get return URL or default to home
      const returnUrl = sessionStorage.getItem('zklogin_return_url') || '/';
      const scrollPosition = sessionStorage.getItem('zklogin_scroll_position');
      sessionStorage.removeItem('zklogin_return_url');
      sessionStorage.removeItem('zklogin_scroll_position');

      // Store scroll position to restore after navigation
      if (scrollPosition) {
        sessionStorage.setItem('restore_scroll_position', scrollPosition);
      }

      setTimeout(() => {
        router.push(returnUrl);
      }, 1000);

    } catch (err: any) {
      console.error('zkLogin error:', err);
      setError(err.message || 'Failed to complete authentication');
      setTimeout(() => router.push('/'), 3000);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-red-600 dark:text-red-500 text-5xl mb-4">✗</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Failed</h1>
          <p className="text-red-600 dark:text-red-500 mb-4">{error}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting to home...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-500 mx-auto mb-6"></div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing Authentication
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{status}</p>
      </div>
    </main>
  );
}
