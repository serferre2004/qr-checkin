import { Suspense } from "react";
import ScanPage from "./ScanPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ScanPage />
    </Suspense>
  );
}
