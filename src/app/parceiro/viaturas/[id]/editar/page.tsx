/** @format */

"use client";

import React, { use, useState, useEffect, useCallback } from "react";
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Categoria {
  id: string;
  nome: string;
}

interface ViaturaData {
  id: string;
  modelo: string;
  marca: string | null;
  matricula: string | null;
  ano: number | null;
  lugares: number;
  malas: number;
  foto_url: string | null;
  ativo: boolean;
  preco_base: number;
  ar_condicionado: boolean | null;
  transmissao: string | null;
  categoria_id: string | null;
  parceiro_id: string | null;
}

const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/25 focus:border-[#902ad1]/50 transition-all";

const labelClass =
  "block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5";

export default function EditarViaturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [formData, setFormData] = useState({
    modelo: "",
    marca: "",
    matricula: "",
    ano: "",
    categoria_id: "",
    lugares: "4",
    malas: "2",
    preco_base: "",
    ar_condicionado: false,
    transmissao: "manual",
    foto_url: "",
    ativo: true,
  });

  const fetchViatura = useCallback(async () => {
    try {
      setLoading(true);

      const [catRes, viaturaRes] = await Promise.all([
        supabase.from("categorias").select("id, nome").order("nome"),
        supabase.from("viaturas").select("*").eq("id", id).single(),
      ]);

      setCategorias(catRes.data || []);

      if (viaturaRes.error || !viaturaRes.data) {
        setNotFound(true);
        return;
      }

      const v = viaturaRes.data as ViaturaData;
      setFormData({
        modelo: v.modelo || "",
        marca: v.marca || "",
        matricula: v.matricula || "",
        ano: v.ano?.toString() || "",
        categoria_id: v.categoria_id || "",
        lugares: v.lugares?.toString() || "4",
        malas: v.malas?.toString() || "2",
        preco_base: v.preco_base?.toString() || "",
        ar_condicionado: v.ar_condicionado ?? false,
        transmissao: v.transmissao || "manual",
        foto_url: v.foto_url || "",
        ativo: v.ativo ?? true,
      });
    } catch (err) {
      console.error("Erro ao carregar viatura:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchViatura();
  }, [fetchViatura]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleToggleAtivo = async () => {
    setToggling(true);
    try {
      const newAtivo = !formData.ativo;
      const { error } = await supabase
        .from("viaturas")
        .update({ ativo: newAtivo })
        .eq("id", id);

      if (error) throw error;
      setFormData((prev) => ({ ...prev, ativo: newAtivo }));
    } catch {
      setErro("Erro ao atualizar estado da viatura.");
    } finally {
      setToggling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (!formData.modelo.trim()) {
      setErro("O modelo é obrigatório.");
      return;
    }
    if (!formData.matricula.trim()) {
      setErro("A matrícula é obrigatória.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("viaturas")
        .update({
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
          ativo: formData.ativo,
        })
        .eq("id", id);

      if (error) throw error;

      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        router.push(`/parceiro/viaturas/${id}`);
      }, 1500);
    } catch (err) {
      console.error("Erro ao guardar viatura:", err);
      setErro("Erro ao guardar as alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={36} className="animate-spin text-[#902ad1]" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          A carregar viatura…
        </p>
      </div>
    );
  }

  /* ─── Not Found ─── */
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mb-4 border border-rose-100">
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Viatura não encontrada</h3>
        <p className="text-sm text-slate-400 mt-1 mb-8 max-w-xs text-center">
          Esta viatura não existe ou foi removida.
        </p>
        <Link
          href="/parceiro/viaturas"
          className="inline-flex items-center gap-2 bg-[#902ad1] text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-[#902ad1]/25 hover:bg-[#902ad1]/90 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          Voltar a Viaturas
        </Link>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/parceiro/viaturas/${id}`}
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
              <Link href={`/parceiro/viaturas/${id}`} className="hover:text-[#902ad1] transition-all">
                Detalhe
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Editar</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                Editar {formData.marca ? `${formData.marca} ${formData.modelo}` : formData.modelo}
              </h1>
              <span
                className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                  formData.ativo
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-500"
                }`}
              >
                {formData.ativo ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle ativo */}
        <button
          type="button"
          onClick={handleToggleAtivo}
          disabled={toggling}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm border-2 transition-all ${
            formData.ativo
              ? "border-rose-100 text-rose-500 hover:bg-rose-50"
              : "border-emerald-100 text-emerald-500 hover:bg-emerald-50"
          }`}
        >
          {toggling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : formData.ativo ? (
            <XCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {formData.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>

      {/* Alerts */}
      {erro && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-semibold">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-2xl text-sm font-semibold">
          <CheckCircle2 size={16} />
          Alterações guardadas com sucesso! Redirecionando...
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

          {/* Section: Capacidade */}
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

        {/* Right: Photo + Status */}
        <div className="space-y-5">
          {/* Photo card */}
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
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Car size={40} strokeWidth={1} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">
                    Sem foto
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

          {/* Quick info card */}
          <div className="bg-gradient-to-br from-[#902ad1] to-[#6b1fa0] rounded-2xl p-5 text-white space-y-3 shadow-lg shadow-[#902ad1]/30">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
              Estado Actual
            </p>
            <h3 className="text-base font-semibold leading-tight">
              {formData.marca && formData.modelo
                ? `${formData.marca} ${formData.modelo}`
                : formData.modelo || "Viatura"}
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
            <div
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                formData.ativo ? "bg-emerald-500/30 text-emerald-200" : "bg-rose-500/30 text-rose-200"
              }`}
            >
              {formData.ativo ? (
                <CheckCircle2 size={10} />
              ) : (
                <XCircle size={10} />
              )}
              {formData.ativo ? "Ativa" : "Inativa"}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/parceiro/viaturas/${id}`}
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
          {saving ? "A guardar…" : "Guardar Alterações"}
        </button>
      </div>
    </form>
  );
}
