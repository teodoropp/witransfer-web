/** @format */

"use client";

import { use } from "react";
import ViaturaForm from "@/components/admin/viatura-form";

export default function EditarViaturaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <ViaturaForm id={resolvedParams.id} />;
}
