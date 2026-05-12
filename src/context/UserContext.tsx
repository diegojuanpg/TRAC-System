import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface AthleteEntry {
  email: string;
  name: string;
  sheetId: string;
  scriptUrl: string;
}

export interface User {
  email: string;
  name: string;
  picture: string;
  scriptUrl: string | null;
  sheetId: string | null;
  athleteName: string | null;
  isAdmin?: boolean;
  athletes?: AthleteEntry[];
}

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

const STORAGE_KEY = "trac_user";

const DEV_MOCK_USER: User | null = import.meta.env.DEV
  ? {
      email: "atleta@demo.com",
      name: "Atleta de Prueba",
      picture: "https://ui-avatars.com/api/?name=Atleta+Prueba&background=random",
      scriptUrl: "mock_url",
      sheetId: "mock_sheet",
      athleteName: "Atleta de Prueba",
    }
  : null;

function loadStoredUser(): User | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.email !== "string"
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as User;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(() => {
    const stored = loadStoredUser();
    if (stored) return stored;
    if (import.meta.env.DEV && !import.meta.env.VITE_ROUTER_SCRIPT_URL) {
      return DEV_MOCK_USER;
    }
    return null;
  });

  const setUser = (u: User | null) => {
    setUserState(u);
    try {
      if (u) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage may be disabled */
    }
  };

  useEffect(() => {
    const refreshRouting = async () => {
      if (!user?.email) return;

      try {
        const routerUrl = import.meta.env.VITE_ROUTER_SCRIPT_URL;
        const token = import.meta.env.VITE_SHARED_TOKEN;

        if (!routerUrl || !token) return;

        const url = new URL(routerUrl);
        url.searchParams.set("action", "lookup");
        url.searchParams.set("token", token);
        url.searchParams.set("email", user.email);
        const res = await fetch(url.toString());
        const json = await res.json();

        if (json.success && json.data) {
          const { scriptUrl, sheetId, athleteName, isAdmin, athletes } = json.data;

          if (
            scriptUrl !== user.scriptUrl ||
            sheetId !== user.sheetId ||
            athleteName !== user.athleteName ||
            isAdmin !== user.isAdmin
          ) {
            setUser({
              ...user,
              scriptUrl,
              sheetId,
              athleteName,
              isAdmin: !!isAdmin,
              athletes: athletes ?? user.athletes,
            });
          }
        } else if (json.error === "Atleta no encontrado en la allowed list.") {
          setUser(null);
        }
      } catch {
        /* silent — non-critical background refresh */
      }
    };

    refreshRouting();
  }, [user?.email]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
