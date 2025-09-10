// fe/app/providers.tsx
"use client";
import "primereact/resources/themes/lara-light-blue/theme.css"; // Theme có sẵn
import "primereact/resources/primereact.min.css";               // Core
import "primeicons/primeicons.css";                             // Icons
import { PrimeReactProvider } from "primereact/api";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PrimeReactProvider>{children}</PrimeReactProvider>;
}
