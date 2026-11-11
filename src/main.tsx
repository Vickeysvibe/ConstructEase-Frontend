import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ApiError } from "@/lib/api/client";
import { ConfirmProvider } from "@/ui";
import { AuthProvider } from "@/app/auth";
import { router } from "@/app/router";
import "@/ui/tokens.css";
import "@/ui/ui.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (403/404/422); retry network/5xx twice.
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" />
        </ConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
