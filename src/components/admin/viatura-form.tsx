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
} from "lucide-react";
import { useRouter } from "next/navigation";
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
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
          Carregando formulário...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Fixo/Flutuante */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {isEditing ? "Editar Viatura" : "Nova Viatura"}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Preencha todos os detalhes técnicos e administrativos.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
          {saving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          <span>{isEditing ? "Guardar Alterações" : "Criar Viatura"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lado Esquerdo: Media */}
        <div className="lg:col-span-1 space-y-8">
          {/* Foto Principal */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                <Camera size={18} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">
                Foto de Capa
              </h3>
            </div>

            <div className="relative aspect-[4/3] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group">
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
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm mb-3">
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
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Esta imagem será exibida como principal nos resultados de
              pesquisa.
            </p>
          </div>

          {/* Galeria */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <Plus size={18} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">
                  Galeria
                </h3>
              </div>
              <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
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

            <div className="grid grid-cols-2 gap-3">
              {galeria.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl bg-slate-50 overflow-hidden group">
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
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
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

        {/* Lado Direito: Campos */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dados Gerais */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                <Info size={20} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                Informações da Viatura
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none uppercase"
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
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[11px] font-black text-primary uppercase tracking-[0.3em] ml-1">
                Preço Base Diário (AOA) *
              </label>
              <input
                type="number"
                name="preco_base"
                value={formData.preco_base}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-6 py-6 bg-primary/5 border-2 border-primary/10 rounded-[24px] text-2xl font-black text-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Vínculos Administrativos */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                Vínculos & Categoria
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer">
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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer">
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
                    Viatura Ativa
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Descrição e Documentos */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                  <FileText size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                  Descrição & Notas
                </h3>
              </div>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows={4}
                placeholder="Notas técnicas, observações sobre o estado da viatura ou extras incluídos..."
                className="w-full px-6 py-5 bg-slate-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
              />
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                    <FileText size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                    Documentação (PDF/Imagens)
                  </h3>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer hover:underline bg-primary/5 px-4 py-2 rounded-xl transition-all">
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

              <div className="space-y-3">
                {documentos.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText size={16} className="text-primary" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                        Documento #{idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white hover:bg-primary/5 text-slate-400 hover:text-primary rounded-xl transition-all shadow-sm">
                        <ExternalLink size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setDocumentos((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
