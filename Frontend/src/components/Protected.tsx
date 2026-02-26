"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

export default function Protected({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else setInitialized(true);
    }
  }, [user, loading, router]);

  if (loading || !initialized) return <p>Loading...</p>;

  return <>{children}</>;
}