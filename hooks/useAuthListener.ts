import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const useAuthListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in, invalidating user queries');
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['session'] });
          break;
          
        case 'SIGNED_OUT':
          console.log('User signed out, clearing query cache');
          queryClient.clear();
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed, invalidating user queries');
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['session'] });
          break;
          
        case 'USER_UPDATED':
          console.log('User updated, invalidating user queries');
          queryClient.invalidateQueries({ queryKey: ['user'] });
          break;
          
        default:
          console.log('Other auth event:', event);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [queryClient]);
};