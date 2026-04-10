import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface User {
  email: string;
  name: string;
  picture: string;
  /** URL of the coach's Data Logger script for this athlete */
  scriptUrl: string | null;
  /** ID of the athlete's spreadsheet */
  sheetId: string | null;
  /** Name of the athlete from the allowed list */
  athleteName: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Persist user across page reloads
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("trac_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem("trac_user", JSON.stringify(u));
    else localStorage.removeItem("trac_user");
  };

  // Refresh routing info from Router Script in the background
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
          const { scriptUrl, sheetId, athleteName } = json.data;
          
          // Only update if something changed to avoid unnecessary re-renders
          if (
            scriptUrl !== user.scriptUrl || 
            sheetId !== user.sheetId || 
            athleteName !== user.athleteName
          ) {
            console.log("User background refresh: Updated routing info.");
            setUser({
              ...user,
              scriptUrl,
              sheetId,
              athleteName
            });
          }
        } else if (json.error === "Atleta no encontrado en la allowed list.") {
          // If athlete was removed from allowed list, logout automatically
          console.warn("User background refresh: Athlete no longer authorized. Logging out.");
          setUser(null);
        }
      } catch (err) {
        console.error("User background refresh error:", err);
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
