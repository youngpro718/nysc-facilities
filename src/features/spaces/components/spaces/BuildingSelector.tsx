
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BuildingSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function BuildingSelector({ value, onChange, className }: BuildingSelectorProps) {
  const { data: buildings, isLoading } = useQuery({
    queryKey: QUERY_KEYS.buildings(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name")
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: QUERY_CONFIG.stale.long,
    gcTime: QUERY_CONFIG.gc.long,
  });

  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Loading buildings..." : "All Buildings"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Buildings</SelectItem>
        {buildings?.map((building) => (
          <SelectItem key={building.id} value={building.id}>
            {building.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
