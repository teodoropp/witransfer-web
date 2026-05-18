/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Camera,
  Plus,
  Trash2,
  FileText,
  Upload,
  X,
  Loader2,
  Info,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Car,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface ViaturaFormProps {
  id?: string;
}

export default function ViaturaForm({ id }: ViaturaFormProps) {
  const router = useRouter();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.marca.trim() || !formData.modelo.trim()) {
        alert("Por favor, preencha a Marca e o Modelo para prosseguir.");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.preco_base.trim() || parseFloat(formData.preco_base) <= 0) {
        alert("Por favor, introduza um Preço Base Diário válido.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = (targetStep?: number) => {
    const next = targetStep ?? (currentStep + 1);
    
    if (next > currentStep) {
      for (let s = currentStep; s < next; s++) {
        if (!validateStep(s)) return;
      }
    }
    
    setCurrentStep(next);
  };

  // Opções para Selects
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>(
    [],
  );
  const [parceiros, setParceiros] = useState<{ id: string; nome: string }[]>(
    [],
  );
  const [motoristas, setMotoristas] = useState<{ id: string; nome: string }[]>(
    [],
  );

  // Estado do Formulário
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    matricula: "",
    ano: new Date().getFullYear().toString(),
    cor: "",
    lugares: "4",
    malas: "2",
    km: "0",
    preco_base: "",
    descricao: "",
    categoria_id: "",
    parceiro_id: "",
    motorista_id: "",
    ativo: true,
  });

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [galeria, setGaleria] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Carregar opções
        const [catRes, parRes, motRes] = await Promise.all([
          supabase.from("categorias").select("id, nome").order("nome"),
          supabase.from("parceiros").select("id, nome").order("nome"),
          supabase.from("motoristas").select(`
            id,
            perfis!motoristas_perfil_id_fkey(nome_completo)
          `),
        ]);

        setCategorias(catRes.data || []);
        setParceiros(parRes.data || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMotoristas(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (motRes.data || []).map((m: any) => ({
            id: m.id,
            nome: m.perfis?.nome_completo || "Motorista Sem Nome",
          })),
        );

        // Carregar viatura se for edição
        if (id) {
          const { data: v, error } = await supabase
            .from("viaturas")
            .select("*")
            .eq("id", id)
            .single();

          if (v) {
            setFormData({
              marca: v.marca || "",
              modelo: v.modelo || "",
              matricula: v.matricula || "",
              ano: v.ano?.toString() || "",
              cor: v.cor || "",
              lugares: v.lugares?.toString() || "4",
              malas: v.malas?.toString() || "2",
              km: v.km?.toString() || "0",
              preco_base: v.preco_base?.toString() || "",
              descricao: v.descricao || "",
              categoria_id: v.categoria_id || "",
              parceiro_id: v.parceiro_id || "",
              motorista_id: v.motorista_id || "",
              ativo: v.ativo ?? true,
            });
            setFotoUrl(v.foto_url);
            setGaleria(v.imagens_galeria || []);
            setDocumentos(v.documentos_url || []);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
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
    type: "principal" | "galeria" | "doc",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `viaturas/${type}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("viaturas")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("viaturas").getPublicUrl(filePath);

        if (type === "principal") setFotoUrl(publicUrl);
        else if (type === "galeria") setGaleria((prev) => [...prev, publicUrl]);
        else if (type === "doc") setDocumentos((prev) => [...prev, publicUrl]);
      }
    } catch (err) {
      alert("Erro ao carregar ficheiro.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marca || !formData.modelo || !formData.parceiro_id) {
      alert("Por favor preencha os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        marca: formData.marca,
        modelo: formData.modelo,
        matricula: formData.matricula.toUpperCase(),
        ano: parseInt(formData.ano) || null,
        cor: formData.cor,
        lugares: parseInt(formData.lugares) || 4,
        malas: parseInt(formData.malas) || 2,
        km: parseInt(formData.km) || 0,
        preco_base: parseFloat(formData.preco_base) || 0,
        descricao: formData.descricao,
        categoria_id: formData.categoria_id || null,
        parceiro_id: formData.parceiro_id || null,
        motorista_id: formData.motorista_id || null,
        ativo: formData.ativo,
        foto_url: fotoUrl,
        imagens_galeria: galeria,
        documentos_url: documentos,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("viaturas")
          .update(dataToSave)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("viaturas").insert([dataToSave]);
        if (error) throw error;
      }

      router.push("/admin/viaturas");
    } catch (err) {
      alert("Erro ao guardar viatura.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
          Carregando formulário...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header com Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-50 rounded-[10px] border border-slate-100 text-slate-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/admin/viaturas" className="hover:text-[#902ad1] transition-all">
                Viaturas
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">{isEditing ? "Editar Viatura" : "Nova Viatura"}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
              {isEditing ? "Editar Viatura" : "Nova Viatura"}
            </h1>
          </div>
        </div>
      </div>

      {/* Indicador de Passos */}
      <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-slate-100 rounded-full z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-[#902ad1] rounded-full transition-all duration-500 z-0" 
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {[
            { step: 1, label: "Identificação", desc: "Dados básicos" },
            { step: 2, label: "Especificações", desc: "Técnico e preço" },
            { step: 3, label: "Fotos", desc: "Média do veículo" },
            { step: 4, label: "Administração", desc: "Proprietário e anexos" }
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;

            return (
              <div key={s.step} className="relative z-10 flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => {
                    if (s.step < currentStep) {
                      setCurrentStep(s.step);
                    } else if (s.step > currentStep) {
                      handleNextStep(s.step);
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#902ad1] text-white shadow-md shadow-[#902ad1]/20 scale-105"
                      : isActive
                      ? "bg-white border-4 border-[#902ad1] text-[#902ad1] shadow-lg shadow-[#902ad1]/10 scale-110"
                      : "bg-slate-50 border-2 border-slate-200 text-slate-400 hover:bg-slate-100"
                  }`}>
                  {isCompleted ? "✓" : s.step}
                </button>
                <div className="mt-3 text-center">
                  <span className={`text-xs font-black uppercase tracking-wider block ${isActive ? "text-[#902ad1]" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:block mt-0.5">
                    {s.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Dinâmico com base no currentStep */}
      <div className="bg-white p-10 rounded-[10px] border border-slate-100 shadow-sm min-h-[400px] flex flex-col justify-between">
        
        <div className="flex-1">
          {/* PASSO 1: IDENTIFICAÇÃO */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                  <Info size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                  Dados Básicos de Identificação
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    placeholder="Ex: Toyota"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    placeholder="Ex: Land Cruiser"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    name="matricula"
                    value={formData.matricula}
                    onChange={handleInputChange}
                    placeholder="LD-00-00-XX"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Ano
                    </label>
                    <input
                      type="number"
                      name="ano"
                      value={formData.ano}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Cor
                    </label>
                    <input
                      type="text"
                      name="cor"
                      value={formData.cor}
                      onChange={handleInputChange}
                      placeholder="Branco"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: ESPECIFICAÇÕES & PREÇO */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                  <Car size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                  Especificações Técnicas e Tarifas
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Lugares
                  </label>
                  <input
                    type="number"
                    name="lugares"
                    value={formData.lugares}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Malas
                  </label>
                  <input
                    type="number"
                    name="malas"
                    value={formData.malas}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    KM Atual
                  </label>
                  <input
                    type="number"
                    name="km"
                    value={formData.km}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[11px] font-black text-[#902ad1] uppercase tracking-[0.3em] ml-1">
                  Preço Base Diário (AOA) *
                </label>
                <input
                  type="number"
                  name="preco_base"
                  value={formData.preco_base}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-6 py-6 bg-[#902ad1]/5 border-2 border-[#902ad1]/10 rounded-[10px] text-2xl font-black text-[#902ad1] focus:ring-4 focus:ring-[#902ad1]/10 transition-all outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* PASSO 3: MÉDIA & FOTOS */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                  <Camera size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                  Fotografias da Viatura
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Foto Principal */}
                <div className="space-y-4">
                  <h4 className="font-black text-slate-700 uppercase tracking-widest text-[11px]">
                    Foto de Capa (Principal)
                  </h4>
                  <div className="relative aspect-[4/3] rounded-[10px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group">
                    {fotoUrl ? (
                      <>
                        <Image
                          src={fotoUrl}
                          alt="Viatura"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-3 bg-white rounded-full text-slate-800 cursor-pointer hover:scale-110 transition-transform">
                            <Upload size={20} />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "principal")}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFotoUrl(null)}
                            className="p-3 bg-white rounded-full text-rose-500 hover:scale-110 transition-transform">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 bg-white rounded-[10px] flex items-center justify-center text-slate-400 shadow-sm mb-3">
                          <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          Adicionar Foto
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "principal")}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Galeria */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-700 uppercase tracking-widest text-[11px]">
                      Galeria de Fotos
                    </h4>
                    <label className="text-xs font-bold text-[#902ad1] cursor-pointer hover:underline">
                      Adicionar
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "galeria")}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {galeria.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-[10px] bg-slate-50 overflow-hidden group">
                        <Image
                          src={img}
                          alt={`Galeria ${idx}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setGaleria((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-[10px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                      <Plus size={20} />
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "galeria")}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: ADMINISTRAÇÃO & ANEXOS */}
          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                  Vínculos Administrativos & Anexos
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Parceiro (Proprietário) *
                  </label>
                  <select
                    name="parceiro_id"
                    value={formData.parceiro_id}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none appearance-none cursor-pointer"
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
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Categoria de Viatura
                  </label>
                  <select
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none appearance-none cursor-pointer">
                    <option value="">Selecionar Categoria</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Motorista Atribuído
                  </label>
                  <select
                    name="motorista_id"
                    value={formData.motorista_id}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none appearance-none cursor-pointer">
                    <option value="">Nenhum Motorista</option>
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-6">
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
                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ml-4 text-sm font-bold text-slate-700">
                      Viatura Ativa (Visível para Aluguer)
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#902ad1]/5 rounded-xl text-[#902ad1]">
                    <FileText size={20} />
                  </div>
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                    Descrição & Anexos Legais
                  </h4>
                </div>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Notas técnicas, observações sobre o estado da viatura ou extras incluídos..."
                  className="w-full px-6 py-5 bg-slate-50 border-none rounded-[10px] text-sm font-medium focus:ring-2 focus:ring-[#902ad1]/20 transition-all outline-none resize-none"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Anexar Documentos (PDF / Fotos)
                  </span>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#902ad1] cursor-pointer hover:underline bg-[#902ad1]/5 px-4 py-2 rounded-[10px] transition-all">
                    <Plus size={14} />
                    Anexar
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, "doc")}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {documentos.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-[#902ad1]" />
                        <span className="text-xs font-bold text-slate-600">
                          Documento #{idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white text-slate-400 hover:text-[#902ad1] rounded-lg shadow-sm">
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentos((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="p-2 bg-white text-slate-400 hover:text-rose-500 rounded-lg shadow-sm">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botoes de Controle de Navegação do Multi-Step */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-sm transition-all ${
              currentStep === 1
                ? "opacity-0 pointer-events-none"
                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 active:scale-95 shadow-sm"
            }`}>
            <ArrowLeft size={16} />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-black tracking-widest uppercase mr-3">
              Passo {currentStep} de 4
            </span>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => handleNextStep()}
                className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-8 py-3.5 rounded-[10px] font-bold text-sm transition-all shadow-md shadow-[#902ad1]/10 active:scale-95">
                <span>Seguinte</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-8 py-3.5 rounded-[10px] font-bold text-sm transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 disabled:opacity-50">
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>{isEditing ? "Guardar Alterações" : "Criar Viatura"}</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </form>
  );
}
