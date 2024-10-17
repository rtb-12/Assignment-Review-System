import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WorkspaceState {
  workspaceId: string;
  isAdmin: boolean;
}

const initialState: WorkspaceState = {
  workspaceId: "",
  isAdmin: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaceId: (state, action: PayloadAction<string>) => {
      state.workspaceId = action.payload;
    },
    setIsAdmin: (state, action: PayloadAction<boolean>) => {
      state.isAdmin = action.payload;
    },
  },
});

export const { setWorkspaceId, setIsAdmin } = workspaceSlice.actions;

export default workspaceSlice.reducer;
