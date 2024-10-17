import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GroupState {
  groupId: string;
}

const initialState: GroupState = {
  groupId: "",
};

const groupStateSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroupId: (state, action: PayloadAction<string>) => {
      state.groupId = action.payload;
    },
  },
});

export const { setGroupId } = groupStateSlice.actions;

export default groupStateSlice.reducer;
