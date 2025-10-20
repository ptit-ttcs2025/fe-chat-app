import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { store } from '@/store/store';
import { Provider } from 'react-redux';
import Mainapp from '@/feature-module/router/router';
import AppInitializer from '@/core/common/AppInitializer';
import { base_path } from './environment.tsx';

// CSS imports
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import '../node_modules/@fortawesome/fontawesome-free/css/all.min.css'
import "../src/assets/style/icon/boxicons/boxicons/css/boxicons.min.css";
import "../src/assets/style/icon/weather/weathericons.css";
import "../src/assets/style/icon/typicons/typicons.css";
import "../src/assets/style/icon/fontawesome/css/fontawesome.min.css";
import "../src/assets/style/icon/fontawesome/css/all.min.css";
import "../src/assets/style/icon/ionic/ionicons.css";
import "../src/assets/style/icon/tabler-icons/webfont/tabler-icons.css";
import "../src/assets/style/icon/feather/css/iconfont.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.scss";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HelmetProvider>
            <Provider store={store}>
                <AppInitializer>
                    <QueryClientProvider client={queryClient}>
                        <BrowserRouter basename={base_path}>
                            <Mainapp />
                        </BrowserRouter>
                    </QueryClientProvider>
                </AppInitializer>
            </Provider>
        </HelmetProvider>
    </StrictMode>
);
