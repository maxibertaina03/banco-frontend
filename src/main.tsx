
  import { createRoot } from "react-dom/client";
  import { AppProviders } from "./app/providers.tsx";
  import { AppRouter } from "./app/router.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
  
