import { Suspense } from 'react';
import AuthCallback from './AuthCallback';
export default function AuthPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthCallback />
    </Suspense>
  );
}