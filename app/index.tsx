import { Redirect } from 'expo-router';

// In Phase 3 we will replace this with real auth logic.
// For now, redirect to patient dashboard to test routing.
export default function Index() {
  return <Redirect href="/(patient)/dashboard" />;
}
