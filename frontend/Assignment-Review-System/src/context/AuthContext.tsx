import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface AuthContextProps {
  isAuthenticated: boolean;
  user: { username: string; profilePic: string } | null;
  login: (
    user: { username: string; profilePic: string },
    tokens: { access: string; refresh: string; csrf: string }
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    username: string;
    profilePic: string;
  } | null>(null);

  useEffect(() => {
    const accessToken = Cookies.get("access_token");
    const csrfToken = Cookies.get("csrf_token");
    const refreshToken = Cookies.get("refresh_token");

    if (accessToken && csrfToken && refreshToken) {
      console.log("User is authenticated");
      setIsAuthenticated(true);
      fetchUserDetails(accessToken, csrfToken);
    }
  }, []);

  const fetchUserDetails = async (accessToken: string, csrfToken: string) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/user/details/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-CSRFToken": csrfToken,
          },
        }
      );
      const { username, profile_pic } = response.data;
      setUser({ username, profilePic: profile_pic });
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  const login = (
    user: { username: string; profilePic: string },
    tokens: { access: string; refresh: string; csrf: string }
  ) => {
    setIsAuthenticated(true);
    setUser(user);
    Cookies.set("access_token", tokens.access, {
      sameSite: "Strict",
      secure: true,
    });
    Cookies.set("refresh_token", tokens.refresh, {
      sameSite: "Strict",
      secure: true,
    });
    Cookies.set("csrf_token", tokens.csrf, {
      sameSite: "Strict",
      secure: true,
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("csrf_token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
