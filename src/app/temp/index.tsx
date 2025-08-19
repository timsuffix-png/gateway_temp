import AuthProvider, { useAuth } from "@/components/auth/authProvider";
import { useEffect } from "react";
import Routing from "./routing";

export default function Index() {
  const auth = useAuth();
  useEffect(() => {}, [auth]);

  return (
    <AuthProvider>
      <Routing />
    </AuthProvider>
  );
}
