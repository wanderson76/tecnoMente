import os
import pandas as pd
import io
import re
from django.core.management.base import BaseCommand
from django.db import connection
from boletim.models import Escola, Turma, Aluno, Disciplina, RegistroBoletim

class Command(BaseCommand):
    help = 'Varre o diretório, limpa os CSVs da SED, unifica Notas e Faltas, e popula o SQLite.'

    def limpar_nota(self, valor):
        if pd.isna(valor) or str(valor).strip() in ['S/N', '#NUM!', '', '-', 'S/D']:
            return 0.0
        try:
            return float(str(valor).replace(',', '.'))
        except ValueError:
            return 0.0

    def extrair_faltas_fechamento(self, path_fechamento):
        """Varre o relatório de fechamento para extrair as faltas do 2º Bimestre"""
        faltas_map = {}
        if not os.path.exists(path_fechamento):
            return faltas_map
        
        with open(path_fechamento, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        start_idx = 0
        for idx, line in enumerate(lines):
            if 'Situação' in line or 'Nome' in line:
                start_idx = idx
                break
        
        df = pd.read_csv(io.StringIO(''.join(lines[start_idx:])))
        col_nome = [c for c in df.columns if 'NOME' in c.upper()][0]
        
        # Localiza a coluna de faltas do 2º Bimestre
        # O padrão da SED costuma ser: 1º Bi.l, Nº Faltas, 2º Bi.l, Nº Faltas...
        col_faltas_2b = None
        faltas_cols = [idx for idx, c in enumerate(df.columns) if 'Nº FALTAS' in c.upper() or 'FALTAS' in c.upper()]
        if len(faltas_cols) >= 2:
            col_faltas_2b = df.columns[faltas_cols[1]] # Segunda coluna de faltas = 2º Bimestre

        for _, row in df.iterrows():
            if pd.isna(row[col_nome]):
                continue
            nome = str(row[col_nome]).strip().upper()
            faltas = int(self.limpar_nota(row[col_faltas_2b])) if col_faltas_2b else 0
            faltas_map[nome] = faltas
            
        return faltas_map

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('⚡ Iniciando carga integrada [Notas + Fechamento Faltas]...'))
        
        # Mapeamento exato dos arquivos presentes no seu `ls`
        arquivos_carga = [
            {
                'notas': '2ºbIMESTRE MEDIA - BACKEND.csv', 
                'fechamento': 'RELATORIO_FECHAMENTO_BACKEND - Relatório de Fechamento.csv',
                'escola': 'MARIA JOSE DA PENHA FRUGOLI PROFESSORA', 'turma': '3ª SÉRIE C', 'disciplina': 'BACK-END'
            },
            {
                'notas': '2ºbIMESTRE MEDIA - Carreira_Comp.csv', 
                'fechamento': 'RELATORIO_FECHAMENTO_CARREIRA - Relatório de Fechamento.csv',
                'escola': 'WALKIR VERGANI', 'turma': '2º ANO C', 'disciplina': 'CARREIRA'
            },
            {
                'notas': '2ºbIMESTRE MEDIA - Logica_linguagem.csv', 
                'fechamento': 'RELATORIO_FECHAMENTO_LOGICA - Relatório de Fechamento.csv',
                'escola': 'WALKIR VERGANI', 'turma': '2º ANO C', 'disciplina': 'LÓGICA'
            },
            {
                'notas': '2ºbIMESTRE MEDIA - MetodologiaAgeis.csv', 
                'fechamento': 'RELATORIO_FECHAMENTO_DESENVOLVIMENTO - Relatório de Fechamento.csv',
                'escola': 'WALKIR VERGANI', 'turma': '2º ANO C', 'disciplina': 'METODOLOGIAS ÁGEIS'
            },
            {
                'notas': '2ºbIMESTRE MEDIA - Redes Computadores.csv', 
                'fechamento': 'RELATORIO_FECHAMENTO_REDES - Relatório de Fechamento.csv',
                'escola': 'WALKIR VERGANI', 'turma': '2º ANO C', 'disciplina': 'REDES'
            },
        ]

        for carga in arquivos_carga:
            if not os.path.exists(carga['notas']):
                self.stdout.write(self.style.ERROR(f"❌ Arquivo de notas não encontrado: {carga['notas']}"))
                continue

            self.stdout.write(self.style.SUCCESS(f"🚀 Cruzando Notas e Fechamento de: {carga['disciplina']}"))
            
            # Carrega mapa de faltas em memória
            mapa_faltas = self.extrair_faltas_fechamento(carga['fechamento'])

            # Garante entidades no banco
            escola_obj, _ = Escola.objects.get_or_create(nome=carga['escola'].upper())
            turma_obj, _ = Turma.objects.get_or_create(escola=escola_obj, codigo=carga['turma'].upper())
            disciplina_obj, _ = Disciplina.objects.get_or_create(nome=carga['disciplina'].upper())

            # Ler Notas
            with open(carga['notas'], 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            start_idx = 0
            for idx, line in enumerate(lines):
                if 'Situação' in line or 'Nome' in line:
                    start_idx = idx
                    break
            
            df = pd.read_csv(io.StringIO(''.join(lines[start_idx:])))
            
            col_nome = [c for c in df.columns if 'NOME' in c.upper()][0]
            col_situacao = [c for c in df.columns if 'SITUA' in c.upper()][0]
            col_media = [c for c in df.columns if 'MÉD' in c.upper() or 'MEDIA' in c.upper() or '2º BI' in c.upper() or 'MÉDIA' in c.upper()][-1]

            for _, row in df.iterrows():
                if pd.isna(row[col_nome]) or str(row[col_nome]).strip() == "":
                    continue

                nome_aluno = str(row[col_nome]).strip().upper()
                situacao_aluno = str(row[col_situacao]).strip()

                aluno_obj, _ = Aluno.objects.get_or_create(
                nome=nome_aluno,
                turma=turma_obj, # Agora o Django busca se esse aluno já existe NESTA turma antes de criar outro
                defaults={'situacao': situacao_aluno}
            )

                # Captura de avaliações estruturadas para compor o Pentágono
                p_paulista = next((row[c] for c in df.columns if 'PROVA PAULISTA' in c.upper()), None)
                conceito = next((row[c] for c in df.columns if 'CONCEITO' in c.upper()), None)
                avaliacao = next((row[c] for c in df.columns if 'AVALIAÇÃO' in c.upper() or 'PROVA' in c.upper()), None)
                trabalho = next((row[c] for c in df.columns if 'TRABALHO' in c.upper()), None)
                
                # Busca as faltas mapeadas do fechamento correspondente
                faltas_real = mapa_faltas.get(nome_aluno, 0)

                RegistroBoletim.objects.update_or_create(
                    aluno=aluno_obj,
                    disciplina=disciplina_obj,
                    bimestre=2,
                    defaults={
                        'prova_paulista': self.limpar_nota(p_paulista) if p_paulista is not None else None,
                        'conceito': self.limpar_nota(conceito) if conceito is not None else None,
                        'avaliacao': self.limpar_nota(avaliacao) if avaliacao is not None else None,
                        'trabalho': self.limpar_nota(trabalho) if trabalho is not None else None,
                        'media_final': self.limpar_nota(row[col_media]),
                        'faltas': faltas_real
                    }
                )
        
        self.aplicar_inteligencia_banco()

    def aplicar_inteligencia_banco(self):
        self.stdout.write(self.style.WARNING('⚙️ Configurando JOINS, Views e Triggers Críticas no SQLite...'))
        with connection.cursor() as cursor:
            # Índices de performance estruturais
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_aluno_turma ON l_aluno(turma_id);" if "l_aluno" in connection.introspection.table_names() else "CREATE INDEX IF NOT EXISTS idx_aluno_turma ON boletim_aluno(turma_id);")
            
            # VIEW: Unificação profissional para o painel do conselho
            cursor.execute("DROP VIEW IF EXISTS view_dashboard_consolidado;")
            cursor.execute("""
                CREATE VIEW view_dashboard_consolidado AS
                SELECT 
                    e.nome AS escola_nome,
                    t.id AS turma_id,
                    t.codigo AS turma_codigo,
                    a.id AS aluno_id,
                    a.nome AS aluno_nome,
                    a.situacao,
                    d.nome AS disciplina_nome,
                    b.prova_paulista,
                    b.media_final,
                    b.faltas
                FROM boletim_registroboletim b
                JOIN boletim_aluno a ON b.aluno_id = a.id
                JOIN boletim_turma t ON a.turma_id = t.id
                JOIN boletim_escola e ON t.escola_id = e.id
                JOIN boletim_disciplina d ON b.disciplina_id = d.id;
            """)

            # TRIGGER: Mudança de Situação por Evasão/Absenteísmo Crítico
            cursor.execute("DROP TRIGGER IF EXISTS trg_alerta_reprovacao_faltas;")
            cursor.execute("""
                CREATE TRIGGER trg_alerta_reprovacao_faltas
                AFTER UPDATE ON boletim_registroboletim
                FOR EACH ROW
                WHEN NEW.faltas >= 20
                BEGIN
                    UPDATE boletim_aluno 
                    SET situacao = 'RISCO EVASÃO'
                    WHERE id = NEW.aluno_id;
                END;
            """)
        self.stdout.write(self.style.SUCCESS('🚀 Sistema de Banco de Dados estruturado e povoado com sucesso!'))