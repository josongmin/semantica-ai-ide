import { atom } from "jotai";

export interface ModelCost {
  model: string;
  cost: number;
  color: string;
}

export interface CostAlert {
  id: string;
  message: string;
  threshold: number;
  current: number;
}

export const modelCostsAtom = atom<ModelCost[]>([]);
export const costAlertsAtom = atom<CostAlert[]>([]);
export const sessionCostHistoryAtom = atom<number[]>([]);
