import { Suspense } from 'react';
import AuthCallback from './page';
export default function AuthPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthCallback />
    </Suspense>
  );
}