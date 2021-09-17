import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMeQuery } from '../generated/graphql';

export const useAuth = () => {
    const router = useRouter();
    const {data, loading} = useMeQuery();

    const routes = ["/login", "/register", "/forgot-password", "/change-password"];

    useEffect(() => {
      if (!loading) {
        if (data?.me && routes.includes(router.route)) {
          router.replace("/");
        } 
        else if (!data?.me && !routes.includes(router.route)) {
          router.replace("/login");
        }
      }
    }, [data, router, loading]);

    return { data, loading };
}