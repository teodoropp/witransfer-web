/** @format */

"use client";

import React, { use } from "react";
import ClienteForm from "@/components/admin/cliente-form";

interface EditarClientePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditarClientePage({ params }: EditarClientePageProps) {
  const resolvedParams = use(params);
  return <ClienteForm id={resolvedParams.id} />;
}
