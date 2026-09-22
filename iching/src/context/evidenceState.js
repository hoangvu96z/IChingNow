import { createContext, useContext } from 'react';

export const EvidenceContext = createContext(null);
export function useEvidence() { return useContext(EvidenceContext); }
