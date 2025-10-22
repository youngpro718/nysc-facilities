import { useEffect, useState } from 'react';
import { getFacilityEmail } from '@/services/emailConfigService';

export function useFacilityEmail() {
  const [email, setEmail] = useState<string>('facilities@example.com');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmail = async () => {
      const facilityEmail = await getFacilityEmail();
      setEmail(facilityEmail);
      setIsLoading(false);
    };

    loadEmail();
  }, []);

  return { email, isLoading };
}
