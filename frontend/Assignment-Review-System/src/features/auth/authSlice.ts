import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

interface AuthState {
  isAuthenticated: boolean;
  user: any; // Replace with your user type
}

const initialState: AuthState = {
  isAuthenticated: !!Cookies.get("isAuthenticated"),
  user: JSON.parse(Cookies.get("user") || "null"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<any>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      Cookies.set("isAuthenticated", "true");
      Cookies.set("user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      Cookies.remove("isAuthenticated");
      Cookies.remove("user");
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
