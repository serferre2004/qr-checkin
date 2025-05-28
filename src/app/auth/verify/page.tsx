"use client";
import { useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        
        <p className="text-gray-600 mb-6">
          We sent a login link to your email address. Click the link in the email to sign in.
        </p>

        <div className="text-sm text-gray-500 mb-4">
          <p>Didn&apos;t receive the email? Check your spam folder.</p>
        </div>
        
        <button
          onClick={() => window.location.href = sessionId ? `/login?id=${sessionId}` : '/login'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Send another link
        </button>

        {sessionId && (
          <p className="mt-4 text-xs text-gray-400">
            Session: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}