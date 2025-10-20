import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = useApp();

  if (isLoading) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/auth/sign-in" />;
  }

  return <Redirect href="/(tabs)/feed" />;
}