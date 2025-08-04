export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          confinamento_id: string
          created_at: string
          feedback_text: string | null
          id: string
          recommendation_data: Json | null
          recommendation_type: string
          user_agreed: boolean | null
          user_id: string
        }
        Insert: {
          confinamento_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          recommendation_data?: Json | null
          recommendation_type: string
          user_agreed?: boolean | null
          user_id: string
        }
        Update: {
          confinamento_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          recommendation_data?: Json | null
          recommendation_type?: string
          user_agreed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          confinamento_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          plano: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          valor_mensal: number | null
        }
        Insert: {
          confinamento_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          valor_mensal?: number | null
        }
        Update: {
          confinamento_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          valor_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: true
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      combustivel_alertas: {
        Row: {
          ativo: boolean
          confinamento_id: string
          created_at: string
          id: string
          tipo_alerta: string
          updated_at: string
          user_id: string
          valor_limite: number
        }
        Insert: {
          ativo?: boolean
          confinamento_id: string
          created_at?: string
          id?: string
          tipo_alerta: string
          updated_at?: string
          user_id: string
          valor_limite: number
        }
        Update: {
          ativo?: boolean
          confinamento_id?: string
          created_at?: string
          id?: string
          tipo_alerta?: string
          updated_at?: string
          user_id?: string
          valor_limite?: number
        }
        Relationships: [
          {
            foreignKeyName: "combustivel_alertas_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combustivel_alertas_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      combustivel_equipamentos: {
        Row: {
          ano_fabricacao: number | null
          ativo: boolean
          confinamento_id: string
          created_at: string
          id: string
          modelo: string | null
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ano_fabricacao?: number | null
          ativo?: boolean
          confinamento_id: string
          created_at?: string
          id?: string
          modelo?: string | null
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ano_fabricacao?: number | null
          ativo?: boolean
          confinamento_id?: string
          created_at?: string
          id?: string
          modelo?: string | null
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combustivel_equipamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combustivel_equipamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      combustivel_lancamentos: {
        Row: {
          checksum: string | null
          confinamento_id: string
          conflict_resolution: string | null
          created_at: string
          created_by: string | null
          data: string
          device_id: string | null
          equipamento: string
          equipamento_id: string | null
          id: string
          last_modified_by: string | null
          local_timestamp: string | null
          mobile_created_at: string | null
          mobile_synced_at: string | null
          observacoes: string | null
          offline_id: string | null
          operador: string
          operador_id: string | null
          preco_unitario: number
          quantidade_litros: number
          sync_attempts: number | null
          sync_error: string | null
          sync_hash: string | null
          sync_status: string | null
          sync_version: number | null
          tipo_combustivel: string
          updated_at: string
          user_id: string | null
          valor_total: number
        }
        Insert: {
          checksum?: string | null
          confinamento_id: string
          conflict_resolution?: string | null
          created_at?: string
          created_by?: string | null
          data: string
          device_id?: string | null
          equipamento: string
          equipamento_id?: string | null
          id?: string
          last_modified_by?: string | null
          local_timestamp?: string | null
          mobile_created_at?: string | null
          mobile_synced_at?: string | null
          observacoes?: string | null
          offline_id?: string | null
          operador: string
          operador_id?: string | null
          preco_unitario: number
          quantidade_litros: number
          sync_attempts?: number | null
          sync_error?: string | null
          sync_hash?: string | null
          sync_status?: string | null
          sync_version?: number | null
          tipo_combustivel: string
          updated_at?: string
          user_id?: string | null
          valor_total: number
        }
        Update: {
          checksum?: string | null
          confinamento_id?: string
          conflict_resolution?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          device_id?: string | null
          equipamento?: string
          equipamento_id?: string | null
          id?: string
          last_modified_by?: string | null
          local_timestamp?: string | null
          mobile_created_at?: string | null
          mobile_synced_at?: string | null
          observacoes?: string | null
          offline_id?: string | null
          operador?: string
          operador_id?: string | null
          preco_unitario?: number
          quantidade_litros?: number
          sync_attempts?: number | null
          sync_error?: string | null
          sync_hash?: string | null
          sync_status?: string | null
          sync_version?: number | null
          tipo_combustivel?: string
          updated_at?: string
          user_id?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "combustivel_lancamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combustivel_lancamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
          {
            foreignKeyName: "combustivel_lancamentos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "combustivel_equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      confinamentos: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          data_assinatura: string | null
          email: string | null
          endereco: string | null
          id: string
          master_user_id: string | null
          nome: string
          razao_social: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          data_assinatura?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          master_user_id?: string | null
          nome: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          data_assinatura?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          master_user_id?: string | null
          nome?: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dim_curral: {
        Row: {
          area_cocho_m: number | null
          area_m2: number | null
          confinamento_id: string
          created_at: string | null
          curral: string | null
          id_curral: string
          setor: string | null
        }
        Insert: {
          area_cocho_m?: number | null
          area_m2?: number | null
          confinamento_id: string
          created_at?: string | null
          curral?: string | null
          id_curral: string
          setor?: string | null
        }
        Update: {
          area_cocho_m?: number | null
          area_m2?: number | null
          confinamento_id?: string
          created_at?: string | null
          curral?: string | null
          id_curral?: string
          setor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_curral_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dim_curral_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      etl_staging_01_historico_consumo: {
        Row: {
          ajuste_kg: number | null
          batch_id: string | null
          cmn_previsto_kg: number | null
          cmn_realizado_kg: number | null
          cms_previsto_kg: number | null
          cms_real_pc_pv: number | null
          cms_realizado_kg: number | null
          data: string
          data_entrada: string | null
          dias_confinamento: number | null
          grupo_genetico: string | null
          id: number
          id_curral: string
          leitura_cocho: string | null
          leitura_noturna: string | null
          lote: string | null
          ms_dieta_meta_pc: number | null
          ms_dieta_real_pc: number | null
          peso_entrada_kg: number | null
          peso_medio_estimado_kg: number | null
          processed: boolean | null
          qtd_animais: number | null
          sexo: string | null
          uploaded_at: string | null
        }
        Insert: {
          ajuste_kg?: number | null
          batch_id?: string | null
          cmn_previsto_kg?: number | null
          cmn_realizado_kg?: number | null
          cms_previsto_kg?: number | null
          cms_real_pc_pv?: number | null
          cms_realizado_kg?: number | null
          data: string
          data_entrada?: string | null
          dias_confinamento?: number | null
          grupo_genetico?: string | null
          id?: number
          id_curral: string
          leitura_cocho?: string | null
          leitura_noturna?: string | null
          lote?: string | null
          ms_dieta_meta_pc?: number | null
          ms_dieta_real_pc?: number | null
          peso_entrada_kg?: number | null
          peso_medio_estimado_kg?: number | null
          processed?: boolean | null
          qtd_animais?: number | null
          sexo?: string | null
          uploaded_at?: string | null
        }
        Update: {
          ajuste_kg?: number | null
          batch_id?: string | null
          cmn_previsto_kg?: number | null
          cmn_realizado_kg?: number | null
          cms_previsto_kg?: number | null
          cms_real_pc_pv?: number | null
          cms_realizado_kg?: number | null
          data?: string
          data_entrada?: string | null
          dias_confinamento?: number | null
          grupo_genetico?: string | null
          id?: number
          id_curral?: string
          leitura_cocho?: string | null
          leitura_noturna?: string | null
          lote?: string | null
          ms_dieta_meta_pc?: number | null
          ms_dieta_real_pc?: number | null
          peso_entrada_kg?: number | null
          peso_medio_estimado_kg?: number | null
          processed?: boolean | null
          qtd_animais?: number | null
          sexo?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      etl_staging_02_desvio_carregamento: {
        Row: {
          batch_id: string | null
          carregamento: string | null
          data: string
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          hora_carregamento: string | null
          id: number
          ingrediente: string | null
          pazeiro: string | null
          previsto_kg: number | null
          processed: boolean | null
          realizado_kg: number | null
          status: string | null
          tipo_ingrediente: string | null
          uploaded_at: string | null
          vagao: string | null
        }
        Insert: {
          batch_id?: string | null
          carregamento?: string | null
          data: string
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          hora_carregamento?: string | null
          id?: number
          ingrediente?: string | null
          pazeiro?: string | null
          previsto_kg?: number | null
          processed?: boolean | null
          realizado_kg?: number | null
          status?: string | null
          tipo_ingrediente?: string | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Update: {
          batch_id?: string | null
          carregamento?: string | null
          data?: string
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          hora_carregamento?: string | null
          id?: number
          ingrediente?: string | null
          pazeiro?: string | null
          previsto_kg?: number | null
          processed?: boolean | null
          realizado_kg?: number | null
          status?: string | null
          tipo_ingrediente?: string | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      etl_staging_03_desvio_distribuicao: {
        Row: {
          batch_id: string | null
          data: string
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          hora_trato: string | null
          id: number
          id_curral: string | null
          lote: string | null
          previsto_kg: number | null
          processed: boolean | null
          realizado_kg: number | null
          status: string | null
          tratador: string | null
          trato: string | null
          uploaded_at: string | null
          vagao: string | null
        }
        Insert: {
          batch_id?: string | null
          data: string
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          hora_trato?: string | null
          id?: number
          id_curral?: string | null
          lote?: string | null
          previsto_kg?: number | null
          processed?: boolean | null
          realizado_kg?: number | null
          status?: string | null
          tratador?: string | null
          trato?: string | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Update: {
          batch_id?: string | null
          data?: string
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          hora_trato?: string | null
          id?: number
          id_curral?: string | null
          lote?: string | null
          previsto_kg?: number | null
          processed?: boolean | null
          realizado_kg?: number | null
          status?: string | null
          tratador?: string | null
          trato?: string | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      etl_staging_04_itens_trato: {
        Row: {
          batch_id: string | null
          carregamento: string | null
          data: string
          dieta: string | null
          hora_carregamento: string | null
          id: number
          id_carregamento: string
          ingrediente: string | null
          ms_dieta_real: number | null
          pazeiro: string | null
          processed: boolean | null
          realizado_mn_kg: number | null
          uploaded_at: string | null
          vagao: string | null
        }
        Insert: {
          batch_id?: string | null
          carregamento?: string | null
          data: string
          dieta?: string | null
          hora_carregamento?: string | null
          id?: number
          id_carregamento: string
          ingrediente?: string | null
          ms_dieta_real?: number | null
          pazeiro?: string | null
          processed?: boolean | null
          realizado_mn_kg?: number | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Update: {
          batch_id?: string | null
          carregamento?: string | null
          data?: string
          dieta?: string | null
          hora_carregamento?: string | null
          id?: number
          id_carregamento?: string
          ingrediente?: string | null
          ms_dieta_real?: number | null
          pazeiro?: string | null
          processed?: boolean | null
          realizado_mn_kg?: number | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      etl_staging_05_trato_curral: {
        Row: {
          batch_id: string | null
          data: string
          dieta: string | null
          hora_trato: string | null
          id: number
          id_carregamento: string
          id_curral: string
          lote: string | null
          ms_dieta_real: number | null
          peso_abastecido_kg: number | null
          processed: boolean | null
          tratador: string | null
          trato: number | null
          uploaded_at: string | null
          vagao: string | null
        }
        Insert: {
          batch_id?: string | null
          data: string
          dieta?: string | null
          hora_trato?: string | null
          id?: number
          id_carregamento: string
          id_curral: string
          lote?: string | null
          ms_dieta_real?: number | null
          peso_abastecido_kg?: number | null
          processed?: boolean | null
          tratador?: string | null
          trato?: number | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Update: {
          batch_id?: string | null
          data?: string
          dieta?: string | null
          hora_trato?: string | null
          id?: number
          id_carregamento?: string
          id_curral?: string
          lote?: string | null
          ms_dieta_real?: number | null
          peso_abastecido_kg?: number | null
          processed?: boolean | null
          tratador?: string | null
          trato?: number | null
          uploaded_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      fato_carregamento: {
        Row: {
          carregamento: string | null
          categoria_desvio: string | null
          confinamento_id: string
          created_at: string | null
          data: string
          desvio_abs_pc: number | null
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          hora_carregamento: string | null
          id_carregamento: string | null
          id_curral: string | null
          ingrediente: string | null
          pazeiro: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          tipo_dieta: string | null
          tipo_ingrediente: string | null
          unique_key: string | null
          vagao: string | null
        }
        Insert: {
          carregamento?: string | null
          categoria_desvio?: string | null
          confinamento_id: string
          created_at?: string | null
          data: string
          desvio_abs_pc?: number | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          hora_carregamento?: string | null
          id_carregamento?: string | null
          id_curral?: string | null
          ingrediente?: string | null
          pazeiro?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_dieta?: string | null
          tipo_ingrediente?: string | null
          unique_key?: string | null
          vagao?: string | null
        }
        Update: {
          carregamento?: string | null
          categoria_desvio?: string | null
          confinamento_id?: string
          created_at?: string | null
          data?: string
          desvio_abs_pc?: number | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          hora_carregamento?: string | null
          id_carregamento?: string | null
          id_curral?: string | null
          ingrediente?: string | null
          pazeiro?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_dieta?: string | null
          tipo_ingrediente?: string | null
          unique_key?: string | null
          vagao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fato_carregamento_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fato_carregamento_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
          {
            foreignKeyName: "fato_carregamento_id_curral_fkey"
            columns: ["id_curral"]
            isOneToOne: false
            referencedRelation: "dim_curral"
            referencedColumns: ["id_curral"]
          },
        ]
      }
      fato_resumo: {
        Row: {
          ajuste_kg: number | null
          area_cocho_m: number | null
          area_m2: number | null
          cmn_previsto_kg: number | null
          cmn_realizado_kg: number | null
          cms_previsto_kg: number | null
          cms_real_pc_pv: number | null
          cms_realizado_kg: number | null
          cocho_cab_m: number | null
          confinamento_id: string
          created_at: string | null
          curral: string | null
          data: string
          data_entrada: string | null
          dias_confinamento: number | null
          eficiencia_cms: number | null
          gmd_padrao: number | null
          grupo_genetico: string | null
          id_curral: string
          leitura_cocho: string | null
          leitura_noturna: string | null
          lote: string | null
          m2_cab: number | null
          ms_dieta_meta_pc: number | null
          ms_dieta_real_pc: number | null
          peso_entrada_kg: number | null
          peso_estimado_corrigido: number | null
          peso_medio_estimado_kg: number | null
          qtd_animais: number | null
          setor: string | null
          sexo: string | null
          status_lote: string | null
          unique_key: string | null
        }
        Insert: {
          ajuste_kg?: number | null
          area_cocho_m?: number | null
          area_m2?: number | null
          cmn_previsto_kg?: number | null
          cmn_realizado_kg?: number | null
          cms_previsto_kg?: number | null
          cms_real_pc_pv?: number | null
          cms_realizado_kg?: number | null
          cocho_cab_m?: number | null
          confinamento_id: string
          created_at?: string | null
          curral?: string | null
          data: string
          data_entrada?: string | null
          dias_confinamento?: number | null
          eficiencia_cms?: number | null
          gmd_padrao?: number | null
          grupo_genetico?: string | null
          id_curral: string
          leitura_cocho?: string | null
          leitura_noturna?: string | null
          lote?: string | null
          m2_cab?: number | null
          ms_dieta_meta_pc?: number | null
          ms_dieta_real_pc?: number | null
          peso_entrada_kg?: number | null
          peso_estimado_corrigido?: number | null
          peso_medio_estimado_kg?: number | null
          qtd_animais?: number | null
          setor?: string | null
          sexo?: string | null
          status_lote?: string | null
          unique_key?: string | null
        }
        Update: {
          ajuste_kg?: number | null
          area_cocho_m?: number | null
          area_m2?: number | null
          cmn_previsto_kg?: number | null
          cmn_realizado_kg?: number | null
          cms_previsto_kg?: number | null
          cms_real_pc_pv?: number | null
          cms_realizado_kg?: number | null
          cocho_cab_m?: number | null
          confinamento_id?: string
          created_at?: string | null
          curral?: string | null
          data?: string
          data_entrada?: string | null
          dias_confinamento?: number | null
          eficiencia_cms?: number | null
          gmd_padrao?: number | null
          grupo_genetico?: string | null
          id_curral?: string
          leitura_cocho?: string | null
          leitura_noturna?: string | null
          lote?: string | null
          m2_cab?: number | null
          ms_dieta_meta_pc?: number | null
          ms_dieta_real_pc?: number | null
          peso_entrada_kg?: number | null
          peso_estimado_corrigido?: number | null
          peso_medio_estimado_kg?: number | null
          qtd_animais?: number | null
          setor?: string | null
          sexo?: string | null
          status_lote?: string | null
          unique_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fato_resumo_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fato_resumo_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
          {
            foreignKeyName: "fato_resumo_id_curral_fkey"
            columns: ["id_curral"]
            isOneToOne: false
            referencedRelation: "dim_curral"
            referencedColumns: ["id_curral"]
          },
        ]
      }
      fato_trato: {
        Row: {
          categoria_eficiencia: string | null
          confinamento_id: string
          created_at: string | null
          data: string
          desvio_abs_kg: number | null
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          eficiencia_trato: number | null
          hora_trato: string | null
          id_carregamento: string | null
          id_curral: string
          lote: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          tipo_dieta: string | null
          tratador: string | null
          trato: string | null
          turno: string | null
          unique_key: string | null
          vagao: string | null
        }
        Insert: {
          categoria_eficiencia?: string | null
          confinamento_id: string
          created_at?: string | null
          data: string
          desvio_abs_kg?: number | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          eficiencia_trato?: number | null
          hora_trato?: string | null
          id_carregamento?: string | null
          id_curral: string
          lote?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_dieta?: string | null
          tratador?: string | null
          trato?: string | null
          turno?: string | null
          unique_key?: string | null
          vagao?: string | null
        }
        Update: {
          categoria_eficiencia?: string | null
          confinamento_id?: string
          created_at?: string | null
          data?: string
          desvio_abs_kg?: number | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          eficiencia_trato?: number | null
          hora_trato?: string | null
          id_carregamento?: string | null
          id_curral?: string
          lote?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_dieta?: string | null
          tratador?: string | null
          trato?: string | null
          turno?: string | null
          unique_key?: string | null
          vagao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fato_trato_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fato_trato_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
          {
            foreignKeyName: "fato_trato_id_curral_fkey"
            columns: ["id_curral"]
            isOneToOne: false
            referencedRelation: "dim_curral"
            referencedColumns: ["id_curral"]
          },
        ]
      }
      mobile_activity_log: {
        Row: {
          action: string
          app_version: string | null
          batch_id: string | null
          confinamento_id: string | null
          data_after: Json | null
          data_before: Json | null
          device_id: string
          device_info: Json | null
          error_details: string | null
          id: string
          network_type: string | null
          os_version: string | null
          processing_time_ms: number | null
          record_id: string | null
          success: boolean | null
          sync_batch_id: string | null
          table_affected: string | null
          timestamp_local: string | null
          timestamp_server: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          app_version?: string | null
          batch_id?: string | null
          confinamento_id?: string | null
          data_after?: Json | null
          data_before?: Json | null
          device_id: string
          device_info?: Json | null
          error_details?: string | null
          id?: string
          network_type?: string | null
          os_version?: string | null
          processing_time_ms?: number | null
          record_id?: string | null
          success?: boolean | null
          sync_batch_id?: string | null
          table_affected?: string | null
          timestamp_local?: string | null
          timestamp_server?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          app_version?: string | null
          batch_id?: string | null
          confinamento_id?: string | null
          data_after?: Json | null
          data_before?: Json | null
          device_id?: string
          device_info?: Json | null
          error_details?: string | null
          id?: string
          network_type?: string | null
          os_version?: string | null
          processing_time_ms?: number | null
          record_id?: string | null
          success?: boolean | null
          sync_batch_id?: string | null
          table_affected?: string | null
          timestamp_local?: string | null
          timestamp_server?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_activity_log_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_activity_log_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      mobile_config: {
        Row: {
          auto_sync_on_mobile_data: boolean | null
          auto_sync_on_wifi: boolean | null
          batch_size: number | null
          business_hours_end: string | null
          business_hours_start: string | null
          compression_enabled: boolean | null
          confinamento_id: string
          created_at: string | null
          enable_photo_sync: boolean | null
          id: string
          max_photo_size_mb: number | null
          max_retry_attempts: number | null
          offline_limit_days: number | null
          sync_interval_minutes: number | null
          sync_only_business_hours: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_sync_on_mobile_data?: boolean | null
          auto_sync_on_wifi?: boolean | null
          batch_size?: number | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          compression_enabled?: boolean | null
          confinamento_id: string
          created_at?: string | null
          enable_photo_sync?: boolean | null
          id?: string
          max_photo_size_mb?: number | null
          max_retry_attempts?: number | null
          offline_limit_days?: number | null
          sync_interval_minutes?: number | null
          sync_only_business_hours?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_sync_on_mobile_data?: boolean | null
          auto_sync_on_wifi?: boolean | null
          batch_size?: number | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          compression_enabled?: boolean | null
          confinamento_id?: string
          created_at?: string | null
          enable_photo_sync?: boolean | null
          id?: string
          max_photo_size_mb?: number | null
          max_retry_attempts?: number | null
          offline_limit_days?: number | null
          sync_interval_minutes?: number | null
          sync_only_business_hours?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_config_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: true
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_config_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      mobile_devices: {
        Row: {
          app_version: string | null
          authorized_at: string | null
          authorized_by: string | null
          confinamento_id: string
          created_at: string | null
          device_id: string
          device_model: string | null
          device_name: string | null
          id: string
          is_active: boolean | null
          last_seen: string | null
          last_sync: string | null
          os_type: string | null
          os_version: string | null
          push_token: string | null
          sync_preferences: Json | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          authorized_at?: string | null
          authorized_by?: string | null
          confinamento_id: string
          created_at?: string | null
          device_id: string
          device_model?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          last_sync?: string | null
          os_type?: string | null
          os_version?: string | null
          push_token?: string | null
          sync_preferences?: Json | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          authorized_at?: string | null
          authorized_by?: string | null
          confinamento_id?: string
          created_at?: string | null
          device_id?: string
          device_model?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          last_sync?: string | null
          os_type?: string | null
          os_version?: string | null
          push_token?: string | null
          sync_preferences?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_devices_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_devices_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      mobile_sync_error_log: {
        Row: {
          device_id: string | null
          error_context: string | null
          error_message: string | null
          error_type: string
          id: number
          record_id: number | null
          table_name: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          device_id?: string | null
          error_context?: string | null
          error_message?: string | null
          error_type: string
          id?: never
          record_id?: number | null
          table_name?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          device_id?: string | null
          error_context?: string | null
          error_message?: string | null
          error_type?: string
          id?: never
          record_id?: number | null
          table_name?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      production_logs: {
        Row: {
          component: string
          confinamento_id: string | null
          context: Json | null
          correlation_id: string | null
          device_id: string | null
          id: number
          level: string
          message: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          component: string
          confinamento_id?: string | null
          context?: Json | null
          correlation_id?: string | null
          device_id?: string | null
          id?: number
          level: string
          message: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string
          confinamento_id?: string | null
          context?: Json | null
          correlation_id?: string | null
          device_id?: string | null
          id?: number
          level?: string
          message?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          funcao: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          funcao?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          funcao?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          checksum: string | null
          confinamento_id: string
          created_at: string | null
          data: Json
          device_id: string
          error_message: string | null
          id: string
          max_retries: number | null
          offline_id: string | null
          operation: string
          priority: number | null
          retry_count: number | null
          status: string | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          checksum?: string | null
          confinamento_id: string
          created_at?: string | null
          data: Json
          device_id: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          offline_id?: string | null
          operation: string
          priority?: number | null
          retry_count?: number | null
          status?: string | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          checksum?: string | null
          confinamento_id?: string
          created_at?: string | null
          data?: Json
          device_id?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          offline_id?: string | null
          operation?: string
          priority?: number | null
          retry_count?: number | null
          status?: string | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_queue_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      user_confinamentos: {
        Row: {
          confinamento_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          confinamento_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          confinamento_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_confinamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_confinamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      user_invites: {
        Row: {
          confinamento_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
        }
        Insert: {
          confinamento_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
        }
        Update: {
          confinamento_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          confinamento_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          confinamento_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          confinamento_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      usuarios_combustivel: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: string
          confinamento_nome: string
          data_cadastro: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo: string
          confinamento_nome: string
          data_cadastro?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string
          confinamento_nome?: string
          data_cadastro?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          ultimo_acesso?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_mobile_sync_status: {
        Row: {
          device_name: string | null
          last_sync: string | null
          pending_operations: number | null
          recent_errors: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_admin_troubleshooting: {
        Row: {
          category: string | null
          data: Json | null
        }
        Relationships: []
      }
      v_alertas_ativos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string | null
          tipo_alerta: string | null
          valor_limite: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string | null
          tipo_alerta?: string | null
          valor_limite?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string | null
          tipo_alerta?: string | null
          valor_limite?: number | null
        }
        Relationships: []
      }
      v_combustivel_analytics_fast: {
        Row: {
          abastecimentos_dia: number | null
          confinamento_id: string | null
          data: string | null
          litros_dia: number | null
          litros_semana_anterior: number | null
          media_movel_7d: number | null
          preco_medio_dia: number | null
          ranking_consumo_dia: number | null
          tipo_combustivel: string | null
        }
        Relationships: [
          {
            foreignKeyName: "combustivel_lancamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "confinamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combustivel_lancamentos_confinamento_id_fkey"
            columns: ["confinamento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_main_optimized"
            referencedColumns: ["confinamento_id"]
          },
        ]
      }
      v_combustivel_equipamentos_ranking: {
        Row: {
          equipamento: string | null
          preco_medio: number | null
          primeira_utilizacao: string | null
          total_lancamentos: number | null
          total_litros: number | null
          total_valor: number | null
          ultima_utilizacao: string | null
        }
        Relationships: []
      }
      v_combustivel_operadores_ranking: {
        Row: {
          operador: string | null
          primeira_operacao: string | null
          total_lancamentos: number | null
          total_litros: number | null
          total_valor: number | null
          ultima_operacao: string | null
        }
        Relationships: []
      }
      v_combustivel_resumo_diario: {
        Row: {
          data: string | null
          equipamentos_utilizados: string | null
          operadores: string | null
          preco_medio: number | null
          tipo_combustivel: string | null
          total_lancamentos: number | null
          total_litros: number | null
          total_valor: number | null
        }
        Relationships: []
      }
      v_combustivel_resumo_mensal: {
        Row: {
          dias_com_lancamentos: number | null
          equipamentos_utilizados: string | null
          mes: string | null
          preco_medio: number | null
          tipo_combustivel: string | null
          total_lancamentos: number | null
          total_litros: number | null
          total_valor: number | null
        }
        Relationships: []
      }
      v_consumo_por_equipamento: {
        Row: {
          equipamento: string | null
          preco_medio: number | null
          total_abastecimentos: number | null
          total_gasto: number | null
          total_litros: number | null
          ultimo_abastecimento: string | null
        }
        Relationships: []
      }
      v_consumo_por_usuario: {
        Row: {
          cargo: string | null
          total_gasto: number | null
          total_lancamentos: number | null
          total_litros: number | null
          ultimo_lancamento: string | null
          usuario: string | null
        }
        Relationships: []
      }
      v_dashboard_main_optimized: {
        Row: {
          animais_confinamento: number | null
          cms_medio_7d: number | null
          combustivel_preco_medio: number | null
          combustivel_total_30d: number | null
          combustivel_valor_30d: number | null
          confinamento_id: string | null
          confinamento_nome: string | null
          dispositivos_ativos: number | null
          eficiencia_media: number | null
          operacoes_pendentes: number | null
          status_geral: string | null
          ultima_sincronizacao: string | null
          ultimo_abastecimento: string | null
        }
        Relationships: []
      }
      v_etl_processing_status: {
        Row: {
          last_upload: string | null
          pending_records: number | null
          processed_records: number | null
          table_name: string | null
          total_batches: number | null
          total_records: number | null
        }
        Relationships: []
      }
      v_performance_metrics_realtime: {
        Row: {
          category: string | null
          metric: string | null
          value: number | null
        }
        Relationships: []
      }
      v_sync_conflict_resolution: {
        Row: {
          conflict_resolution: string | null
          created_by: string | null
          device_id: string | null
          id: string | null
          last_modified_by: string | null
          sync_hash: string | null
          sync_status: string | null
          sync_version: number | null
          updated_at: string | null
        }
        Insert: {
          conflict_resolution?: string | null
          created_by?: string | null
          device_id?: string | null
          id?: string | null
          last_modified_by?: string | null
          sync_hash?: string | null
          sync_status?: string | null
          sync_version?: number | null
          updated_at?: string | null
        }
        Update: {
          conflict_resolution?: string | null
          created_by?: string | null
          device_id?: string | null
          id?: string | null
          last_modified_by?: string | null
          sync_hash?: string | null
          sync_status?: string | null
          sync_version?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_sync_performance: {
        Row: {
          action: string | null
          data: string | null
          device_id: string | null
          event_date: string | null
          failed_operations: number | null
          success_rate: number | null
          successful_operations: number | null
          total_events: number | null
          total_operations: number | null
        }
        Relationships: []
      }
      v_sync_status_summary: {
        Row: {
          confinamento_name: string | null
          device_id: string | null
          device_name: string | null
          error_operations: number | null
          id: string | null
          is_active: boolean | null
          last_activity: string | null
          last_error: string | null
          last_sync: string | null
          pending_operations: number | null
          sync_status: string | null
          user_name: string | null
        }
        Relationships: []
      }
      v_system_health_check: {
        Row: {
          checked_at: string | null
          metric_name: string | null
          metric_value: string | null
          severity: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      alert_slow_queries: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_type: string
          severity: string
          message: string
          query_text: string
          avg_time_ms: number
        }[]
      }
      apply_operation_safe_corrected: {
        Args: { operation: Json }
        Returns: Json
      }
      calcular_eficiencia_pazeiro: {
        Args: { data_inicio: string; data_fim: string }
        Returns: {
          pazeiro: string
          total_carregamentos: number
          tempo_medio_carregamento: number
          eficiencia_rank: number
        }[]
      }
      cleanup_old_sync_data: {
        Args: { retention_days?: number }
        Returns: {
          deleted_logs: number
          deleted_queue: number
          inactive_devices: number
        }[]
      }
      cleanup_staging_tables: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_sync_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      detect_conflict: {
        Args: { operation: Json }
        Returns: boolean
      }
      detectar_problemas_operacionais: {
        Args: { data_analise: string }
        Returns: {
          tipo_problema: string
          descricao: string
          id_carregamento: string
          hora_problema: string
          severidade: string
        }[]
      }
      emergency_rollback_sync_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_record_checksum: {
        Args: { data_record: Json }
        Returns: string
      }
      generate_sync_hash: {
        Args: { record_data: Json }
        Returns: string
      }
      get_status_eficiencia: {
        Args: { cms_realizado: number; cms_previsto: number }
        Returns: string
      }
      get_sync_metrics: {
        Args: {
          p_device_id?: string
          p_period?: number
          p_max_results?: number
        }
        Returns: Json
      }
      get_sync_status_summary: {
        Args: { p_device_id: string }
        Returns: {
          total_records: number
          pending_sync: number
          synced_records: number
          conflict_records: number
          error_records: number
        }[]
      }
      get_tipo_dieta: {
        Args: { dieta: string }
        Returns: string
      }
      get_turno: {
        Args: { hora_input: string }
        Returns: string
      }
      get_user_confinamentos: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_master_of_confinamento: {
        Args: { confinamento_id: string }
        Returns: boolean
      }
      log_structured: {
        Args: {
          p_level: string
          p_component: string
          p_message: string
          p_context?: Json
          p_user_id?: string
          p_device_id?: string
          p_confinamento_id?: string
          p_correlation_id?: string
        }
        Returns: undefined
      }
      maintenance_routine_production: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_combustivel_references: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      optimize_connection_settings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_dim_date: {
        Args: { start_date: string; end_date: string }
        Returns: undefined
      }
      process_etl_daily_batch: {
        Args: { p_confinamento_id?: string; p_batch_id?: string }
        Returns: {
          fato_resumo_inserted: number
          fato_carregamento_inserted: number
          fato_trato_inserted: number
          processing_time_seconds: number
          status: string
          error_message: string
        }[]
      }
      process_mobile_batch: {
        Args: { p_device_id: string; p_operations: Json }
        Returns: Json
      }
      process_sync_queue_item: {
        Args: { queue_id: string }
        Returns: Json
      }
      scheduled_cleanup: {
        Args:
          | Record<PropertyKey, never>
          | { standard_cleanup_days?: number; test_data_cleanup_days?: number }
        Returns: {
          deleted_standard_records: number
          deleted_test_records: number
        }[]
      }
      soft_delete_lancamento: {
        Args: { record_id: number }
        Returns: undefined
      }
      test_critical_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          execution_time_ms: number
          status: string
          details: string
        }[]
      }
      transform_curral_code: {
        Args: { curral_input: string }
        Returns: string
      }
      user_has_access_to_confinamento: {
        Args: { confinamento_id: string }
        Returns: boolean
      }
      validate_backup_readiness: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          status: string
          details: string
        }[]
      }
      validate_etl_data: {
        Args: { p_batch_id: string }
        Returns: {
          table_name: string
          validation_rule: string
          error_count: number
          sample_errors: string[]
        }[]
      }
      validate_schema_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          issue_type: string
          description: string
          severity: string
        }[]
      }
    }
    Enums: {
      user_role: "master" | "gerencial" | "supervisor" | "operacional" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["master", "gerencial", "supervisor", "operacional", "admin"],
    },
  },
} as const
