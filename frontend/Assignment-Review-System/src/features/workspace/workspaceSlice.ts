import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WorkspaceState {
  workspaceId: string;
}

const initialState: WorkspaceState = {
  workspaceId: "",
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaceId: (state, action: PayloadAction<string>) => {
      state.workspaceId = action.payload;
    },
  },
});

export const { setWorkspaceId } = workspaceSlice.actions;

export default workspaceSlice.reducer;
