import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

interface AuthState {
  isAuthenticated: boolean;
  user: unknown;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export const fetchUserDetails = createAsyncThunk(
  "auth/fetchUserDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/user/details/",
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<unknown>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      console.log("User details:", state.user);
    });
    builder.addCase(fetchUserDetails.rejected, (state) => {
      state.isAuthenticated = false;
      state.user = null;
    });
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
