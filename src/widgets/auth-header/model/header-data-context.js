import { createContext } from "react";
const empty = { data: null, error: "", retry: () => {} };
export const HeaderDataContext = createContext({ candidate: empty, employer: empty });
