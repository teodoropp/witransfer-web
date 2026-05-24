/** @format */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ParceiroRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/parceiro/dashboard");
  }, [router]);

  return null;
}
