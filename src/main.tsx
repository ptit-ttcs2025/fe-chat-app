import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import Mainapp from "./feature-module/router/router";
import { base_path } from "./environment";
import Store from "./core/data/redux/store";
import { Helmet } from "react-helmet";
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
      <title>DreamsChat</title>
      <meta name="description" content="DreamsChat - The best chat experience." />
    </Helmet>
    <Provider store={Store}>
      <BrowserRouter basename={base_path}>
        <Mainapp />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
