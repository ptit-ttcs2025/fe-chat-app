import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '@/slices/auth/reducer';
import { authApis } from '@/apis/auth/auth.api';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApis.reducerPath]: authApis.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware(),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
