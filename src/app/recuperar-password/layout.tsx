import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Password | WiTransfer",
  description: "Recupere o acesso ao seu portal de parceiro WiTransfer.",
};

export default function RecuperarPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
