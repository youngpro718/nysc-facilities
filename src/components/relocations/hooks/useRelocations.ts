
import { useQuery } from "@tanstack/react-query";
import { fetchRelocations, fetchActiveRelocations } from "../services/queries/relocationQueries";

export const useRelocations = () => {
  return useQuery({
    queryKey: ['relocations'],
    queryFn: () => fetchRelocations(),
  });
};

export const useActiveRelocations = () => {
  return useQuery({
    queryKey: ['active-relocations'],
    queryFn: () => fetchActiveRelocations(),
  });
};
