import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // For now, we'll allow all access. In production, add authentication check here
  return <>{children}</>;
}
