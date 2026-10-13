"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function HomePage() {
  const { agent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (agent) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [agent, isLoading, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🎫</p>
        <h1 className="text-2xl font-bold text-primary-700">LotTrack</h1>
      </div>
    </div>
  );
}
