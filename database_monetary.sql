-- Script SQL para o Supabase (Database)
-- Módulo: Correção Monetária

-- 1. Criação da Tabela de Sessões/Listagens (monetary_saved_tables)
CREATE TABLE public.monetary_saved_tables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da Tabela de Carga de Dados (monetary_calculation_results)
CREATE TABLE public.monetary_calculation_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id uuid NOT NULL REFERENCES public.monetary_saved_tables(id) ON DELETE CASCADE,
    data jsonb NOT NULL, -- Armazena as linhas de cálculo consolidadas (Valor Original, Data Inicial, Corrigido, etc.)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Segurança em Nível de Linha (RLS - Row Level Security)
-- Isso impede que um usuário consiga ler ou interagir com os dados financeiros de outro usuário no ecossistema
ALTER TABLE public.monetary_saved_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetary_calculation_results ENABLE ROW LEVEL SECURITY;

-- Políticas (Policies) para monetary_saved_tables
CREATE POLICY "Usuários logados podem ler suas próprias tabelas criadas." 
ON public.monetary_saved_tables 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários logados podem inserir em sua lista." 
ON public.monetary_saved_tables 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários logados podem excluir da sua lista." 
ON public.monetary_saved_tables 
FOR DELETE USING (auth.uid() = user_id);


-- Políticas (Policies) para monetary_calculation_results
CREATE POLICY "Usuários logados podem visualizar os cálculos de suas listagens." 
ON public.monetary_calculation_results 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.monetary_saved_tables WHERE id = table_id AND user_id = auth.uid())
);

CREATE POLICY "Usuários logados podem salvar os dados nas listagens criadas." 
ON public.monetary_calculation_results 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.monetary_saved_tables WHERE id = table_id AND user_id = auth.uid())
);
