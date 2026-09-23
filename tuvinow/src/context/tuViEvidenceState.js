import { createContext, useContext } from 'react';
export const TuViEvidenceContext = createContext(null);
export const useTuViEvidence = () => useContext(TuViEvidenceContext);
