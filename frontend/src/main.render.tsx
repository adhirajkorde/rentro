import React from "react";
import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import router from "./routes";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <router />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);