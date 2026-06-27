import { createContext, useContext, type FC, type ReactNode } from 'react';

const RouteSlotContext = createContext(true);

interface RouteSlotProviderProps {
  isActive: boolean;
  children: ReactNode;
}

export const RouteSlotProvider: FC<RouteSlotProviderProps> = ({ isActive, children }) => {
  return <RouteSlotContext.Provider value={isActive}>{children}</RouteSlotContext.Provider>;
};

export function useRouteSlotActive(): boolean {
  return useContext(RouteSlotContext);
}
