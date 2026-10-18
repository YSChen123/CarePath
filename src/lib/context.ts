import { createContext, useContext } from "react";
import type { Seed } from "./types";
export const DataContext = createContext<Seed | null>(null);
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error("研究数据尚未加载");
  return data;
}
