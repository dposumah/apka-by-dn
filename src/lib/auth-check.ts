import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function checkAuth(allowedRoles?: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized: Please login first', session: null };
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    return { error: 'Forbidden: Access denied for your role', session: null };
  }
  return { error: null, session };
}
