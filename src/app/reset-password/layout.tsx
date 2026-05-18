import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redefinir Password | WiTransfer",
  description: "Escolha uma nova password segura para a sua conta WiTransfer.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
