"use server";

import { supabase } from "../lib/supabase";
import { createHash } from "crypto";

// Funcao responsavel por gerenciar o upload de arquivos para o Supabase Storage
export async function StoreFile(formData: FormData) {
  try {
    // Extrai o arquivo do objeto FormData enviado pelo frontend
    const archive = formData.get('file') as File;
    if (!archive) return { success: false, error: "Arquivo não encontrado." };

    // Converte o arquivo em buffer e gera um hash SHA-256 para evitar duplicidade
    const binary = await archive.arrayBuffer();
    const buffer_file = Buffer.from(binary);
    const hash_file = createHash('sha256').update(buffer_file).digest('hex');

    // Identifica a extensao do arquivo para manter o formato original no armazenamento
    const fileExtension = archive.name.includes('.') ? archive.name.split('.').pop() : 'bin';
    const fileName = `${hash_file}.${fileExtension}`;

    // Faz o upload do arquivo para o bucket especifico no Supabase
    const { error } = await supabase.storage
      .from('poc01_file')
      .upload(fileName, buffer_file, {
        contentType: archive.type,
        upsert: false
      });

    // Trata erro de duplicidade: se o arquivo ja existe, apenas seguimos para gerar a URL
    if (error) {
      const isDuplicate =
        (error as any).status === 409 ||
        error.message?.includes("already exists");

      if (!isDuplicate) {
        throw error;
      }
      console.log("Reaproveitando arquivo existente:", fileName);
    }

    // Busca a URL publica do arquivo para que a IA e o frontend possam acessa-lo
    const { data } = supabase.storage
      .from('poc01_file')
      .getPublicUrl(fileName);

    // Retorna os metadados do arquivo salvos com sucesso
    return {
      success: true,
      id: hash_file,
      url: data.publicUrl,
      name: archive.name,
      size: archive.size
    };

  } catch (error: any) {
    console.error("Erro real no servidor:", error);
    return { success: false, error: error.message || "Falha técnica no upload" };
  }
}