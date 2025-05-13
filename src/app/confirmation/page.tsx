import { Suspense } from "react";
import ConfirmationPage from "./ConfirmationPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ConfirmationPage/>
    </Suspense>
  );
}
