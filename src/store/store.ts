import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/slices/auth/reducer';
import commonReducer from '@/core/data/redux/commonSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        common: commonReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
