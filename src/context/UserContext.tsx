import { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  email: string;
  name: string;
  picture: string;
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

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
