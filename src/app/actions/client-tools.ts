"use server";

import { supabaseAdmin as supabase } from "../lib/supabase";

// Tipagem para facilitar o uso das ferramentas pela IA
export interface ClientInput {
  id?: string
  name?: string;
  email?: string;
  enterprise?: string;
  telephone?: string;
  user_id?: string;
}

//Buscar clientes (todos)
export async function listClientsTool() {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao listar clientes:", error);
    return { success: false, error: error.message };
  }
}

//Buscar um cliente específico
export async function getClientByIdTool(id: string) {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao pegar um cliente pelo id:", error);
    return { success: false, error: error.message };
  }
}

//Criar novo cliente
export async function createClientTool(client: ClientInput) {
  try {
    console.log("IA TENTOU CRIAR O CLIENTE:", client);
    const { data, error } = await supabase
      .from('client')
      .insert([client])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: "Cliente criado com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao criar cliente:", error);
    return { success: false, error: error.message };
  }
}

//Atualizar cliente
export async function updateClientTool(id: string, updates: Partial<ClientInput>) {
  try {
    const { data, error } = await supabase
      .from('client')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: "Dados atualizados com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao atualizar cliente:", error);
    return { success: false, error: error.message };
  }
}

//Deletar cliente
export async function deleteClientTool(id: string) {
  try {
    const { error } = await supabase
      .from('client')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, message: `Cliente ${id} removido com sucesso.` };
  } catch (error: any) {
    console.error("Erro ao deletar cliente:", error);
    return { success: false, error: error.message };
  }
}