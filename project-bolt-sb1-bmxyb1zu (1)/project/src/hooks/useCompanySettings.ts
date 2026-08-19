import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CompanySettings } from '@/types';

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('company_settings').select('*').maybeSingle();
    setSettings(data as CompanySettings | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (values: Partial<CompanySettings>) => {
      if (!settings) return;
      const { error } = await supabase
        .from('company_settings')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', settings.id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [settings, refresh]
  );

  return { settings, loading, update };
}
