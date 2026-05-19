/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Camera,
  Loader2,
  Handshake,
  Mail,
  Phone,
  FileText,
  MapPin,
  Globe,
  Percent,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface ParceiroFormProps {
  id?: string;
}

export default function ParceiroForm({ id }: ParceiroFormProps) {
  const router = useRouter();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    nome: "",
    nif: "",
    email: "",
    telefone: "",
    website: "",
    provincia: "Luanda",
    municipio: "",
    endereco: "",
    area_atividade: "Transportes",
    objetivo_parceria: "",
    responsavel_nome: "",
    responsavel_cargo: "",
    responsavel_email: "",
    responsavel_telefone: "",
    observacoes_admin: "",
    comissao_percentual: 10,
    ativo: true,
    status_aprovacao: "aprovado",
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadParceiro() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: p, error } = await supabase
          .from("parceiros")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (p) {
          setFormData({
            nome: p.nome || "",
            nif: p.nif || "",
            email: p.email || "",
            telefone: p.telefone || "",
            website: p.website || "",
            provincia: p.provincia || "Luanda",
            municipio: p.municipio || "",
            endereco: p.endereco || "",
            area_atividade: p.area_atividade || "Transportes",
            objetivo_parceria: p.objetivo_parceria || "",
            responsavel_nome: p.responsavel_nome || "",
            responsavel_cargo: p.responsavel_cargo || "",
            responsavel_email: p.responsavel_email || "",
            responsavel_telefone: p.responsavel_telefone || "",
            observacoes_admin: p.observacoes_admin || "",
            comissao_percentual: p.comissao_percentual ?? 10,
            ativo: p.ativo ?? true,
            status_aprovacao: p.status_aprovacao || "aprovado",
          });
          setLogoUrl(p.logo_url);
        }
      } catch (err) {
        console.error("Erro ao carregar parceiro:", err);
        alert("Erro ao carregar dados do parceiro.");
      } finally {
        setLoading(false);
      }
    }

    loadParceiro();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "comissao_percentual" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `parceiros/logo/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("motoristas") // Reusando bucket "motoristas" que já possui política pública
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("motoristas").getPublicUrl(filePath);

      setLogoUrl(publicUrl);
    } catch (err) {
      alert("Erro ao carregar logótipo da empresa.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.telefone) {
      alert("Por favor preencha todos os campos obrigatórios (*).");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        // Atualizar parceiro
        const { error } = await supabase
          .from("parceiros")
          .update({
            nome: formData.nome,
            nif: formData.nif || null,
            email: formData.email,
            telefone: formData.telefone,
            website: formData.website || null,
            provincia: formData.provincia,
            municipio: formData.municipio || null,
            endereco: formData.endereco || null,
            area_atividade: formData.area_atividade,
            objetivo_parceria: formData.objetivo_parceria || null,
            responsavel_nome: formData.responsavel_nome || null,
            responsavel_cargo: formData.responsavel_cargo || null,
            responsavel_email: formData.responsavel_email || null,
            responsavel_telefone: formData.responsavel_telefone || null,
            observacoes_admin: formData.observacoes_admin || null,
            comissao_percentual: formData.comissao_percentual,
            ativo: formData.ativo,
            status_aprovacao: formData.status_aprovacao,
            logo_url: logoUrl,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Criar novo parceiro
        const newParceiroId = crypto.randomUUID();
        const { error } = await supabase.from("parceiros").insert([
          {
            id: newParceiroId,
            nome: formData.nome,
            nif: formData.nif || null,
            email: formData.email,
            telefone: formData.telefone,
            website: formData.website || null,
            provincia: formData.provincia,
            municipio: formData.municipio || null,
            endereco: formData.endereco || null,
            area_atividade: formData.area_atividade,
            objetivo_parceria: formData.objetivo_parceria || null,
            responsavel_nome: formData.responsavel_nome || null,
            responsavel_cargo: formData.responsavel_cargo || null,
            responsavel_email: formData.responsavel_email || null,
            responsavel_telefone: formData.responsavel_telefone || null,
            observacoes_admin: formData.observacoes_admin || null,
            comissao_percentual: formData.comissao_percentual,
            ativo: formData.ativo,
            status_aprovacao: formData.status_aprovacao,
            logo_url: logoUrl,
          },
        ]);

        if (error) throw error;
      }

      router.push("/admin/parceiros");
    } catch (err) {
      console.error("Erro ao gravar parceiro:", err);
      alert("Erro ao gravar dados do parceiro.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">
          A carregar formulário...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 pb-12 animate-in fade-in duration-500"
    >
      {/* Header com Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-50 rounded-[10px] border border-slate-100 text-slate-600 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/admin/parceiros" className="hover:text-[#902ad1] transition-all">
                Parceiros
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">
                {isEditing ? "Editar Parceiro" : "Novo Parceiro"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              {isEditing ? "Editar Ficha de Parceiro" : "Registar Novo Parceiro"}
            </h1>
          </div>
        </div>
      </div>

      {/* Grid de Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mx-0 md:mx-[80px]">
        {/* Lado Esquerdo: Inputs */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[10px] border border-slate-100 shadow-sm space-y-8">
          {/* Dados Corporativos */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <Handshake size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Dados da Empresa / Parceiro
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: Taxi Express Lda"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Número de Identificação Fiscal (NIF)
                </label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif}
                  onChange={handleInputChange}
                  placeholder="Ex: 541098273"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
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
                  placeholder="corporativo@empresa.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Website da Empresa
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="www.empresa.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Área de Atividade
                </label>
                <select
                  name="area_atividade"
                  value={formData.area_atividade}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
                >
                  <option value="Transportes">Transportes e Táxi</option>
                  <option value="Turismo">Turismo e Lazer</option>
                  <option value="Logística">Logística e Distribuição</option>
                  <option value="Serviços">Serviços Corporativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dados do Responsável */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <User size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Pessoa de Contacto / Responsável
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  name="responsavel_nome"
                  value={formData.responsavel_nome}
                  onChange={handleInputChange}
                  placeholder="Ex: João da Silva"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Cargo / Função na Empresa
                </label>
                <input
                  type="text"
                  name="responsavel_cargo"
                  value={formData.responsavel_cargo}
                  onChange={handleInputChange}
                  placeholder="Ex: Diretor de Operações"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  E-mail do Responsável
                </label>
                <input
                  type="email"
                  name="responsavel_email"
                  value={formData.responsavel_email}
                  onChange={handleInputChange}
                  placeholder="responsavel@empresa.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Telefone do Responsável
                </label>
                <input
                  type="tel"
                  name="responsavel_telefone"
                  value={formData.responsavel_telefone}
                  onChange={handleInputChange}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Localização e Notas */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <MapPin size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Sede / Localização
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Província
                </label>
                <input
                  type="text"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleInputChange}
                  placeholder="Ex: Luanda"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Município
                </label>
                <input
                  type="text"
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleInputChange}
                  placeholder="Ex: Talatona"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Endereço Completo
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                placeholder="Ex: Via S8, Condomínio Talatona Plaza, Luanda"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Preview Logo, Comissão & Estado */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Logo Empresa */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm text-center space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px]">
              Logótipo da Empresa
            </h4>
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-[#902ad1]/15 mx-auto bg-slate-50 flex items-center justify-center">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logótipo" fill className="object-cover" />
              ) : (
                <Handshake size={48} className="text-slate-350" />
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 rounded-[10px] border border-slate-150 cursor-pointer transition-all">
              <Camera size={14} />
              Enviar Logótipo
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Configurações de Comissão */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Percent size={16} className="text-[#902ad1]" />
              <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px]">
                Taxa de Comissão
              </h4>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Comissão Geral (%)
              </label>
              <input
                type="number"
                name="comissao_percentual"
                value={formData.comissao_percentual}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
              />
              <span className="text-[9px] text-slate-400 font-medium block">
                Percentagem de cada reserva cobrada a este parceiro.
              </span>
            </div>
          </div>

          {/* Controlo de Aprovação e Acesso */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px] border-b border-slate-50 pb-3">
              Aprovação e Acesso
            </h4>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Estado de Aprovação
              </label>
              <select
                name="status_aprovacao"
                value={formData.status_aprovacao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
              >
                <option value="pendente">Pendente de Revisão</option>
                <option value="aprovado">Aprovado Oficial</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>

            <div className="h-[1px] bg-slate-100 my-4" />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Ativo na Plataforma</span>
                <span className="text-[10px] text-slate-400">Permitir login e gestão de frotas</span>
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
          </div>

          {/* Botão Gravar */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white py-4 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>{isEditing ? "Guardar Alterações" : "Registar Parceiro"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
