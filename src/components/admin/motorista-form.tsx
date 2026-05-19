/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Camera,
  Upload,
  X,
  Loader2,
  Info,
  ShieldCheck,
  FileText,
  User,
  Star,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

interface MotoristaFormProps {
  id?: string;
}

export default function MotoristaForm({ id }: MotoristaFormProps) {
  const router = useRouter();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tabelas auxiliares
  const [parceiros, setParceiros] = useState<{ id: string; nome: string }[]>(
    [],
  );
  const [viaturas, setViaturas] = useState<
    { id: string; modelo: string; matricula: string }[]
  >([]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    carta_conducao: "",
    experiencia_anos: "1",
    parceiro_id: "",
    viatura_id: "",
    disponivel: true,
    ativo: true,
    idiomas: "Português",
  });

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [cartaUrl, setCartaUrl] = useState<string | null>(null);
  const [biUrl, setBiUrl] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Carregar Parceiros
        const { data: partData } = await supabase
          .from("parceiros")
          .select("id, nome")
          .order("nome");
        setParceiros(partData || []);

        // 2. Carregar Viaturas (disponíveis ou já atribuídas ao próprio motorista)
        const { data: viatData } = await supabase
          .from("viaturas")
          .select("id, modelo, matricula")
          .order("modelo");
        setViaturas(viatData || []);

        // 3. Se for Edição, carregar os dados
        if (id) {
          const { data: m, error } = await supabase
            .from("motoristas")
            .select(
              `
              *,
              perfis:perfil_id(id, nome_completo, email, telefone, foto_url, ativo)
            `,
            )
            .eq("id", id)
            .single();

          if (m && m.perfis) {
            setPerfilId(m.perfil_id);
            setFormData({
              nome_completo: m.perfis.nome_completo || "",
              email: m.perfis.email || "",
              telefone: m.perfis.telefone || "",
              carta_conducao: m.carta_conducao || "",
              experiencia_anos: m.experiencia_anos?.toString() || "1",
              parceiro_id: m.parceiro_id || "",
              viatura_id: m.viatura_id || "",
              disponivel: m.disponivel ?? true,
              ativo: m.perfis.ativo ?? true,
              idiomas: m.idiomas?.join(", ") || "Português",
            });
            setFotoUrl(m.perfis.foto_url);
            setCartaUrl(m.carta_conducao_url);
            setBiUrl(m.documento_bi_url);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do formulário:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "foto" | "carta" | "bi",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `motoristas/${type}/${fileName}`;

      // Envia ficheiro para o bucket de armazenamento "motoristas"
      const { error: uploadError } = await supabase.storage
        .from("motoristas")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("motoristas").getPublicUrl(filePath);

      if (type === "foto") setFotoUrl(publicUrl);
      else if (type === "carta") setCartaUrl(publicUrl);
      else if (type === "bi") setBiUrl(publicUrl);
    } catch (err) {
      alert("Erro ao enviar ficheiro para o servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.email || !formData.parceiro_id) {
      alert("Por favor preencha todos os campos obrigatórios (*).");
      return;
    }

    setSaving(true);
    try {
      let targetPerfilId = perfilId;

      // 1. Inserir ou Atualizar na tabela "perfis"
      if (!isEditing) {
        // Registo de novo motorista na plataforma
        const newPerfilUuid = crypto.randomUUID();
        const { error: pError } = await supabase.from("perfis").insert([
          {
            id: newPerfilUuid,
            tipo: "motorista",
            nome_completo: formData.nome_completo,
            email: formData.email,
            telefone: formData.telefone,
            foto_url: fotoUrl,
            ativo: formData.ativo,
          },
        ]);

        if (pError) throw pError;
        targetPerfilId = newPerfilUuid;
      } else {
        // Atualização de motorista existente
        const { error: pError } = await supabase
          .from("perfis")
          .update({
            nome_completo: formData.nome_completo,
            email: formData.email,
            telefone: formData.telefone,
            foto_url: fotoUrl,
            ativo: formData.ativo,
          })
          .eq("id", targetPerfilId);

        if (pError) throw pError;
      }

      // 2. Preparar dados específicos de "motoristas"
      const driverData = {
        perfil_id: targetPerfilId!,
        parceiro_id: formData.parceiro_id,
        viatura_id: formData.viatura_id || null,
        carta_conducao: formData.carta_conducao || null,
        carta_conducao_url: cartaUrl,
        documento_bi_url: biUrl,
        experiencia_anos: parseInt(formData.experiencia_anos) || 1,
        disponivel: formData.disponivel,
        idiomas: formData.idiomas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (isEditing) {
        const { error: mError } = await supabase
          .from("motoristas")
          .update(driverData)
          .eq("id", id);
        if (mError) throw mError;
      } else {
        const { error: mError } = await supabase
          .from("motoristas")
          .insert([driverData]);
        if (mError) throw mError;
      }

      // 3. Redirecionar
      router.push("/admin/motoristas");
    } catch (err) {
      console.error("Erro ao guardar motorista:", err);
      alert("Erro ao gravar dados do motorista. Verifique a ligação.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin animate-duration-1000" />
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">
          A carregar formulário...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[30px]">
        <div className="flex items-center">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <button
                type="button"
                onClick={() => router.back()}
                className="hover:text-[#902ad1] text-slate-500 transition-colors flex items-center shrink-0 mr-1"
                title="Voltar">
                <ArrowLeft size={12} strokeWidth={2.5} />
              </button>
              <Link
                href="/admin/dashboard"
                className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/admin/motoristas"
                className="hover:text-[#902ad1] transition-all">
                Motoristas
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">
                {isEditing ? "Editar Motorista" : "Novo Motorista"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Coluna da Esquerda: Inputs */}
        <div
          className={`lg:col-span-8 ${THEME_TOKENS.cardStyle} p-6 md:p-8 space-y-8`}>
          {/* Secção 1: Dados Pessoais */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <User size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Dados Pessoais do Perfil
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleInputChange}
                  placeholder="Ex: João Manuel dos Santos"
                  className="w-full max-w-[400px] px-5 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none block"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Endereço de E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="exemplo@witransfer.org"
                  className="w-full max-w-[400px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none block"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Telefone Principal *
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full max-w-[280px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none block"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Idiomas (Separados por vírgula)
                </label>
                <input
                  type="text"
                  name="idiomas"
                  value={formData.idiomas}
                  onChange={handleInputChange}
                  placeholder="Português, Inglês"
                  className="w-full max-w-[400px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none block"
                />
              </div>
            </div>
          </div>

          {/* Secção 2: Dados Profissionais e Anexos */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Vínculos & Documentos Legais
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Parceiro Oficial *
                </label>
                <select
                  name="parceiro_id"
                  value={formData.parceiro_id}
                  onChange={handleInputChange}
                  className="w-full max-w-[320px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer block"
                  required>
                  <option value="">Selecionar Parceiro</option>
                  {parceiros.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Viatura Atribuída
                </label>
                <select
                  name="viatura_id"
                  value={formData.viatura_id}
                  onChange={handleInputChange}
                  className="w-full max-w-[320px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer block">
                  <option value="">Nenhuma Viatura (Reserva Livre)</option>
                  {viaturas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.modelo} ({v.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Nº da Carta de Condução
                </label>
                <input
                  type="text"
                  name="carta_conducao"
                  value={formData.carta_conducao}
                  onChange={handleInputChange}
                  placeholder="Nº da Carta de Condução"
                  className="w-full max-w-[280px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none block"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Anos de Experiência
                </label>
                <input
                  type="number"
                  name="experiencia_anos"
                  value={formData.experiencia_anos}
                  onChange={handleInputChange}
                  className="w-full max-w-[120px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs focus:bg-white focus:border-[#902ad1] transition-all outline-none block"
                />
              </div>
            </div>

            {/* Documentos Anexados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Carta de Condução */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Carta de Condução (Anexo)
                </label>
                <div className="relative border border-dashed border-slate-200 bg-slate-50/50 rounded-[5px] p-4 flex flex-col items-center justify-center min-h-[120px] transition-all hover:bg-slate-50">
                  {cartaUrl ? (
                    <div className="text-center space-y-2">
                      <FileText size={24} className="text-[#902ad1] mx-auto" />
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide block">
                        Ficheiro Carregado!
                      </span>
                      <div className="flex gap-2 justify-center">
                        <a
                          href={cartaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-500 hover:text-[#902ad1] font-semibold flex items-center gap-1">
                          <ExternalLink size={10} /> Ver
                        </a>
                        <button
                          type="button"
                          onClick={() => setCartaUrl(null)}
                          className="text-[10px] text-rose-500 hover:underline font-semibold">
                          Excluir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center space-y-1.5">
                      <Upload size={20} className="text-slate-400 mx-auto" />
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Fazer Upload da Carta
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "carta")}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Documento BI */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Cópia do BI (Identidade)
                </label>
                <div className="relative border border-dashed border-slate-200 bg-slate-50/50 rounded-[5px] p-4 flex flex-col items-center justify-center min-h-[120px] transition-all hover:bg-slate-50">
                  {biUrl ? (
                    <div className="text-center space-y-2">
                      <FileText size={24} className="text-[#902ad1] mx-auto" />
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide block">
                        BI Carregado!
                      </span>
                      <div className="flex gap-2 justify-center">
                        <a
                          href={biUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-500 hover:text-[#902ad1] font-semibold flex items-center gap-1">
                          <ExternalLink size={10} /> Ver
                        </a>
                        <button
                          type="button"
                          onClick={() => setBiUrl(null)}
                          className="text-[10px] text-rose-500 hover:underline font-semibold">
                          Excluir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center space-y-1.5">
                      <Upload size={20} className="text-slate-400 mx-auto" />
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Fazer Upload do BI
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "bi")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Preview e Toggle de Estado */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card de Foto de Perfil */}
          <div
            className={`${THEME_TOKENS.cardStyle} p-6 text-center space-y-4`}>
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px]">
              Foto do Motorista
            </h4>
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[#902ad1]/15 mx-auto bg-slate-50 flex items-center justify-center">
              {fotoUrl ? (
                <Image
                  src={fotoUrl}
                  alt="Foto do motorista"
                  fill
                  className="object-cover"
                />
              ) : (
                <User size={48} className="text-slate-300" />
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 rounded-[5px] border border-slate-200 cursor-pointer transition-all">
              <Camera size={14} />
              Enviar Foto
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "foto")}
              />
            </label>
          </div>

          {/* Card de Estados de Disponibilidade & Atividade */}
          <div className={`${THEME_TOKENS.cardStyle} p-6 space-y-6`}>
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px] border-b border-slate-50 pb-3">
              Controlos Administrativos
            </h4>

            {/* Ativo/Bloqueado */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">
                  Ativo na Plataforma
                </span>
                <span className="text-[10px] text-slate-400">
                  Permitir login e viagens
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ativo: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#902ad1]"></div>
              </label>
            </div>

            {/* Disponível/Ocupado */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">
                  Livre / Disponível
                </span>
                <span className="text-[10px] text-slate-400">
                  Pronto para receber reservas
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disponivel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      disponivel: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/95 text-white py-3 rounded-[5px] text-xs font-semibold transition-all active:scale-95 disabled:opacity-50">
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>
              {isEditing ? "Guardar Alterações" : "Criar Novo Motorista"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
