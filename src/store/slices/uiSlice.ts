import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  mobileNavOpen: boolean;
  activeRole: 'fans' | 'creators' | 'brands';
  activeDashboardTab: 'user' | 'creator' | 'brand';
  isModalOpen: boolean;
}

const initialState: UIState = {
  mobileNavOpen: false,
  activeRole: 'creators',
  activeDashboardTab: 'creator',
  isModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileNav(state) {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    closeMobileNav(state) {
      state.mobileNavOpen = false;
    },
    setActiveRole(state, action: PayloadAction<UIState['activeRole']>) {
      state.activeRole = action.payload;
    },
    setActiveDashboardTab(state, action: PayloadAction<UIState['activeDashboardTab']>) {
      state.activeDashboardTab = action.payload;
    },
    setModalOpen(state, action: PayloadAction<boolean>) {
      state.isModalOpen = action.payload;
    },
  },
});

export const { toggleMobileNav, closeMobileNav, setActiveRole, setActiveDashboardTab, setModalOpen } =
  uiSlice.actions;
export default uiSlice.reducer;
