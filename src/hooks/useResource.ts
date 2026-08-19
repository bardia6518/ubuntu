import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseResourceOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
}

interface WithId {
  id: string;
}

export function useResource<T extends WithId>(table: string, options: UseResourceOptions = {}) {
  const { select = '*', orderBy = 'created_at', ascending = false } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error: fetchError } = await supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setData((rows ?? []) as unknown as T[]);
    }
    setLoading(false);
  }, [table, select, orderBy, ascending]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insert = useCallback(
    async (values: Partial<T>) => {
      const { data: row, error: insertError } = await supabase
        .from(table)
        .insert(values)
        .select(select)
        .maybeSingle();
      if (insertError) throw new Error(insertError.message);
      await refresh();
      return row as unknown as T;
    },
    [table, select, refresh]
  );

  const update = useCallback(
    async (id: string, values: Partial<T>) => {
      const { error: updateError } = await supabase.from(table).update(values).eq('id', id);
      if (updateError) throw new Error(updateError.message);
      await refresh();
    },
    [table, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    },
    [table, refresh]
  );

  return { data, loading, error, refresh, insert, update, remove };
}
