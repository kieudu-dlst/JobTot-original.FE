import { createContext, useContext } from "react";

export const EmployerSessionContext = createContext(null);
export const useEmployerSession = () => useContext(EmployerSessionContext);
