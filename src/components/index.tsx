import AuthProvider, { useAuth } from "@/lib/auth/authProvider";
import { useEffect } from "react";
import Routing from "@/components/routing";

export default function Index() {
  const auth = useAuth();
  useEffect(() => {}, [auth]);

  return (
    <AuthProvider>
      <Routing />
    </AuthProvider>
  );
}
