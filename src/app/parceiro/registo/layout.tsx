import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WiTransfer | Seja Parceiro",
  description: "Junte-se à WiTransfer como parceiro e comece a gerir a sua frota de forma inteligente. Registo rápido e simples para empresas de transporte.",
};

export default function RegistoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
