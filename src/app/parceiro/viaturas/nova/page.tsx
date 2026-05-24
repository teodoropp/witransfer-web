/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Save,
  Loader2,
  Wind,
  Users,
  Briefcase,
  DollarSign,
  Tag,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Categoria {
  id: string;
  nome: string;
}

const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/25 focus:border-[#902ad1]/50 transition-all";

const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5";

export default function NovaViaturaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    modelo: "",
    marca: "",
    matricula: "",
    ano: new Date().getFullYear().toString(),
    categoria_id: "",
    lugares: "4",
    malas: "2",
    preco_base: "",
    ar_condicionado: false,
    transmissao: "manual",
    foto_url: "",
  });

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData?.id) {
        setErro("Parceiro não encontrado.");
        return;
      }

      setParceiroId(parceiroData.id);

      const { data: catData } = await supabase
        .from("categorias")
        .select("id, nome")
        .order("nome");

      setCategorias(catData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setErro("Erro ao carregar informações.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.modelo.trim()) {
      setErro("O modelo é obrigatório.");
      return;
    }
    if (!formData.matricula.trim()) {
      setErro("A matrícula é obrigatória.");
      return;
    }
    if (!parceiroId) {
      setErro("Parceiro não identificado.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("viaturas").insert({
        parceiro_id: parceiroId,
        modelo: formData.modelo.trim(),
        marca: formData.marca.trim() || null,
        matricula: formData.matricula.trim().toUpperCase(),
        ano: parseInt(formData.ano) || null,
        categoria_id: formData.categoria_id || null,
        lugares: parseInt(formData.lugares) || 4,
        malas: parseInt(formData.malas) || 2,
        preco_base: parseFloat(formData.preco_base) || 0,
        ar_condicionado: formData.ar_condicionado,
        transmissao: formData.transmissao,
        foto_url: formData.foto_url.trim() || null,
        ativo: true,
      });

      if (error) throw error;

      router.push("/parceiro/viaturas");
    } catch (err) {
      console.error("Erro ao guardar viatura:", err);
      setErro("Erro ao guardar a viatura. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={36} className="animate-spin text-[#902ad1]" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          A carregar…
        </p>
      </div>
    );
  }

  const photoPreview = formData.foto_url.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/parceiro/viaturas"
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
            <Link href="/parceiro/viaturas" className="hover:text-[#902ad1] transition-all">
              Viaturas
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Nova Viatura</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Nova Viatura</h1>
        </div>
      </div>

      {/* Error */}
      {erro && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-semibold">
          <span>{erro}</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Main fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Identificação */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-[#902ad1]/10 rounded-xl flex items-center justify-center">
                <Car size={16} className="text-[#902ad1]" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                Identificação
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Modelo *</label>
                <input
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ex: Land Cruiser"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Marca</label>
                <input
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ex: Toyota"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Matrícula *</label>
                <input
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  placeholder="LD-00-00-XX"
                  className={`${inputClass} uppercase`}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Ano</label>
                <input
                  type="number"
                  name="ano"
                  value={formData.ano}
                  onChange={handleChange}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <Tag size={10} />
                  Categoria
                </span>
              </label>
              <select
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="">Selecionar categoria…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Capacidade & Preço */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-[#902ad1]/10 rounded-xl flex items-center justify-center">
                <Users size={16} className="text-[#902ad1]" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                Capacidade & Especificações
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    Lugares
                  </span>
                </label>
                <input
                  type="number"
                  name="lugares"
                  value={formData.lugares}
                  onChange={handleChange}
                  min={1}
                  max={12}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1">
                    <Briefcase size={10} />
                    Malas
                  </span>
                </label>
                <input
                  type="number"
                  name="malas"
                  value={formData.malas}
                  onChange={handleChange}
                  min={0}
                  max={10}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1">
                    <Wind size={10} />
                    Ar Cond.
                  </span>
                </label>
                <label className="flex items-center gap-3 h-[46px] px-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    name="ar_condicionado"
                    checked={formData.ar_condicionado}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#902ad1] rounded"
                  />
                  <span className="text-sm font-semibold text-slate-600">Sim</span>
                </label>
              </div>
              <div>
                <label className={labelClass}>Transmissão</label>
                <select
                  name="transmissao"
                  value={formData.transmissao}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="manual">Manual</option>
                  <option value="automática">Automática</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Preço */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-[#902ad1]/10 rounded-xl flex items-center justify-center">
                <DollarSign size={16} className="text-[#902ad1]" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                Tarifa
              </h2>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#902ad1] uppercase tracking-widest mb-1.5">
                Preço Base (Kz)
              </label>
              <input
                type="number"
                name="preco_base"
                value={formData.preco_base}
                onChange={handleChange}
                placeholder="0"
                min={0}
                className="w-full px-5 py-4 bg-[#902ad1]/5 border-2 border-[#902ad1]/15 rounded-2xl text-2xl font-semibold text-[#902ad1] placeholder:text-[#902ad1]/30 focus:outline-none focus:ring-4 focus:ring-[#902ad1]/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right: Photo */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-[#902ad1]/10 rounded-xl flex items-center justify-center">
                <ImageIcon size={16} className="text-[#902ad1]" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                Fotografia
              </h2>
            </div>

            {/* Preview */}
            <div className="relative aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={() => {}}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Car size={40} strokeWidth={1} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">
                    Pré-visualização
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>URL da Foto</label>
              <input
                name="foto_url"
                value={formData.foto_url}
                onChange={handleChange}
                placeholder="https://…"
                className={inputClass}
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1">
                Cole um link directo para a imagem da viatura.
              </p>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-gradient-to-br from-[#902ad1] to-[#6b1fa0] rounded-2xl p-5 text-white space-y-3 shadow-lg shadow-[#902ad1]/30">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
              Resumo
            </p>
            <h3 className="text-lg font-semibold leading-tight">
              {formData.marca && formData.modelo
                ? `${formData.marca} ${formData.modelo}`
                : "Nova Viatura"}
            </h3>
            {formData.matricula && (
              <span className="inline-block bg-yellow-400 text-yellow-900 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg">
                {formData.matricula.toUpperCase()}
              </span>
            )}
            <div className="flex items-center gap-3 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <Users size={13} />
                {formData.lugares} lug.
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={13} />
                {formData.malas} malas
              </span>
            </div>
            {formData.preco_base && (
              <p className="text-2xl font-semibold">
                {parseFloat(formData.preco_base).toLocaleString("pt-AO")}{" "}
                <span className="text-sm font-semibold opacity-70">Kz</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/parceiro/viaturas"
          className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 disabled:opacity-60 text-white px-8 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-[#902ad1]/25 active:scale-95"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "A guardar…" : "Guardar Viatura"}
        </button>
      </div>
    </form>
  );
}
