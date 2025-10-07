import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import Mainapp from "./feature-module/router/router";
import { base_path } from "./environment";
import { store } from "./store/store"; // ✅ Sửa path
import { queryClient } from "./lib/queryClient"; // ✅ Thêm queryClient

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

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Helmet>
            <title>DreamsChat - PTIT Chat App</title>
            <meta name="description" content="DreamsChat - Real-time chat for PTIT students" />
        </Helmet>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter basename={base_path}>
                    <Mainapp />
                </BrowserRouter>
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
);
