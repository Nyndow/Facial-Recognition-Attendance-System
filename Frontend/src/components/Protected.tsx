"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
  nonAdminOnly?: boolean;
}

export default function Protected({
  children,
  adminOnly = false,
  nonAdminOnly = false,
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasToken =
    typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
    }
  }, [hasToken, router]);

  useEffect(() => {
    if (hasToken && !loading && !user) {
      router.replace("/login");
    }
  }, [hasToken, user, loading, router]);

  useEffect(() => {
    if (!hasToken || loading || !user) return;

    if (adminOnly && !user.isAdmin) {
      router.replace("/dashboard");
      return;
    }

    if (nonAdminOnly && user.isAdmin) {
      router.replace("/dashboard/admin");
    }
  }, [hasToken, loading, user, adminOnly, nonAdminOnly, router]);

  if (!hasToken || loading || !user) return <LoadingSpinner fullScreen />;
  if (adminOnly && !user.isAdmin) return <LoadingSpinner fullScreen />;
  if (nonAdminOnly && user.isAdmin) return <LoadingSpinner fullScreen />;

  return <>{children}</>;
}
