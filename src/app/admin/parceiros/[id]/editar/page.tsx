/** @format */

"use client";

import React, { use } from "react";
import ParceiroForm from "@/components/admin/parceiro-form";

interface EditarParceiroPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditarParceiroPage({ params }: EditarParceiroPageProps) {
  const resolvedParams = use(params);
  return <ParceiroForm id={resolvedParams.id} />;
}
