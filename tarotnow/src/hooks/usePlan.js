import { usePlanForApp } from '../../../shared/src/hooks/usePlan.js';

export function usePlan(isAuthenticated) {
  return usePlanForApp(isAuthenticated, 'tarotnow');
}
