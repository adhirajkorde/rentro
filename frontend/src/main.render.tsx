import React from "react";
import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        {/* App will be rendered by the router */}
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);