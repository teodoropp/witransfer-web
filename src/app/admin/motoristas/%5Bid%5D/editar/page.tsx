/** @format */

"use client";

import React, { use } from "react";
import MotoristaForm from "@/components/admin/motorista-form";

interface EditarMotoristaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditarMotoristaPage({ params }: EditarMotoristaPageProps) {
  const resolvedParams = use(params);
  return <MotoristaForm id={resolvedParams.id} />;
}
