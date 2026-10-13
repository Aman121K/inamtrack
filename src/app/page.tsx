"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Image from "next/image";

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <Image src="/logo.svg" alt="InamTrack" width={80} height={80} className="mx-auto mb-4 rounded-2xl" />
        <h1 className="text-2xl font-bold text-white">InamTrack</h1>
      </div>
    </div>
  );
}
