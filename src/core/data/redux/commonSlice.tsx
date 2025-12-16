import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  darkMode: false,
  mobileSidebar: false,
  miniSidebar: false,
  expandMenu: false,
  // Chat state
  selectedConversationId: null as string | null,
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setDark: (state, { payload }) => {
      state.darkMode = payload;
    },
    setMobileSidebar: (state, { payload }) => {
      state.mobileSidebar = payload;
    },
    setMiniSidebar: (state, { payload }) => {
      state.miniSidebar = payload;
    },
    setExpandMenu: (state, { payload }) => {
      state.expandMenu = payload;
    },
    // ✅ Chat: Set selected conversation
    setSelectedConversation: (state, { payload }) => {
      state.selectedConversationId = payload;
    },
    // ✅ Reset common state về initial state (khi logout)
    resetCommonState: () => initialState,
  },
});

export const { 
  setDark, 
  setMobileSidebar, 
  setMiniSidebar, 
  setExpandMenu, 
  setSelectedConversation,
  resetCommonState 
} = commonSlice.actions;

export default commonSlice.reducer;
