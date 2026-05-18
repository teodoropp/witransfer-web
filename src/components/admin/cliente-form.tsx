/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Camera,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface ClienteFormProps {
  id?: string;
}

export default function ClienteForm({ id }: ClienteFormProps) {
  const router = useRouter();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    documento_numero: "",
    morada: "",
    genero: "M",
    nacionalidade: "Angolana",
    nif: "",
    ativo: true,
  });

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadCliente() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: p, error } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (p) {
          setFormData({
            nome_completo: p.nome_completo || "",
            email: p.email || "",
            telefone: p.telefone || "",
            data_nascimento: p.data_nascimento || "",
            documento_numero: p.documento_numero || "",
            morada: p.morada || "",
            genero: p.genero || "M",
            nacionalidade: p.nacionalidade || "Angolana",
            nif: p.nif || "",
            ativo: p.ativo ?? true,
          });
          setFotoUrl(p.foto_url);
        }
      } catch (err) {
        console.error("Erro ao carregar cliente:", err);
        alert("Erro ao carregar dados do cliente.");
      } finally {
        setLoading(false);
      }
    }

    loadCliente();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `clientes/avatar/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("motoristas") // Reusando o bucket "motoristas" que já possui políticas públicas configuradas
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("motoristas").getPublicUrl(filePath);

      setFotoUrl(publicUrl);
    } catch (err) {
      alert("Erro ao carregar avatar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.email || !formData.telefone) {
      alert("Por favor preencha todos os campos obrigatórios (*).");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        // Atualizar perfil do cliente
        const { error } = await supabase
          .from("perfis")
          .update({
            nome_completo: formData.nome_completo,
            email: formData.email,
            telefone: formData.telefone,
            data_nascimento: formData.data_nascimento || null,
            documento_numero: formData.documento_numero || null,
            morada: formData.morada || null,
            genero: formData.genero,
            nacionalidade: formData.nacionalidade,
            nif: formData.nif || null,
            ativo: formData.ativo,
            foto_url: fotoUrl,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Criar novo perfil de cliente
        const newPerfilId = crypto.randomUUID();
        const { error } = await supabase.from("perfis").insert([
          {
            id: newPerfilId,
            tipo: "cliente",
            nome_completo: formData.nome_completo,
            email: formData.email,
            telefone: formData.telefone,
            data_nascimento: formData.data_nascimento || null,
            documento_numero: formData.documento_numero || null,
            morada: formData.morada || null,
            genero: formData.genero,
            nacionalidade: formData.nacionalidade,
            nif: formData.nif || null,
            ativo: formData.ativo,
            foto_url: fotoUrl,
          },
        ]);

        if (error) throw error;
      }

      router.push("/admin/clientes");
    } catch (err) {
      console.error("Erro ao gravar perfil:", err);
      alert("Erro ao gravar dados do cliente.");
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
              <Link href="/admin/clientes" className="hover:text-[#902ad1] transition-all">
                Clientes
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">
                {isEditing ? "Editar Cliente" : "Novo Cliente"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              {isEditing ? "Editar Ficha de Cliente" : "Adicionar Novo Cliente"}
            </h1>
          </div>
        </div>
      </div>

      {/* Grid de Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mx-0 md:mx-[80px]">
        {/* Lado Esquerdo: Inputs */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[10px] border border-slate-100 shadow-sm space-y-8">
          {/* Dados Gerais */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <User size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Dados Pessoais do Cliente
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
                  placeholder="Ex: Manuel Antunes"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
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
                  placeholder="exemplo@gmail.com"
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
                  Nacionalidade
                </label>
                <input
                  type="text"
                  name="nacionalidade"
                  value={formData.nacionalidade}
                  onChange={handleInputChange}
                  placeholder="Angolana, Portuguesa"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dados Legais e Morada */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                <FileText size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 uppercase tracking-widest text-xs">
                Documentação e Morada
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Número de Identidade (BI / Passaporte)
                </label>
                <input
                  type="text"
                  name="documento_numero"
                  value={formData.documento_numero}
                  onChange={handleInputChange}
                  placeholder="Número do documento"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
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
                  placeholder="NIF do Cliente"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Gênero
                </label>
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Endereço de Residência
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="morada"
                  value={formData.morada}
                  onChange={handleInputChange}
                  placeholder="Ex: Bairro Talatona, Luanda, Angola"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Preview Foto & Estado */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Foto Perfil */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm text-center space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px]">
              Foto do Cliente
            </h4>
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[#902ad1]/15 mx-auto bg-slate-50 flex items-center justify-center">
              {fotoUrl ? (
                <Image src={fotoUrl} alt="Foto do cliente" fill className="object-cover" />
              ) : (
                <User size={48} className="text-slate-350" />
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 rounded-[10px] border border-slate-150 cursor-pointer transition-all">
              <Camera size={14} />
              Enviar Foto
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Estado de Atividade */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px] border-b border-slate-50 pb-3">
              Estado do Utilizador
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Ativo na Plataforma</span>
                <span className="text-[10px] text-slate-400">Permitir login e reservas</span>
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
            <span>{isEditing ? "Guardar Alterações" : "Criar Novo Cliente"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
