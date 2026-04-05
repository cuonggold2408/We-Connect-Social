import { useQuery } from "@tanstack/react-query";

interface ProvinceItem {
  id: string;
  province: string;
}

interface ProvinceResponse {
  success: boolean;
  data: ProvinceItem[];
}

async function fetchProvinces(): Promise<string[]> {
  const res = await fetch("https://vietnamlabs.com/api/vietnamprovince");
  const json: ProvinceResponse = await res.json();
  return json.data
    .map((item) => item.province)
    .sort((a, b) => a.localeCompare(b, "vi"));
}

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: fetchProvinces,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
