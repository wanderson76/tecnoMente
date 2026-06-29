from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view
from .models import Turma # Importante para a listagem funcionar

from django.views.decorators.csrf import csrf_exempt
import json



@api_view(['GET'])
def listar_turmas(request):
    """Retorna todas as turmas cadastradas para alimentar o filtro inicial do dashboard"""
    turmas = Turma.objects.select_related('escola').all()
    dados = [
        {
            'id': t.id,
            'codigo': t.codigo,
            'escola': t.escola.nome
        } for t in turmas
    ]
    return JsonResponse(dados, safe=False)


@api_view(['GET'])
def dashboard_analytics_completo(request, turma_id):
    """
    Endpoint robusto que consolida toda a inteligência de negócios do banco
    para alimentar os componentes e filtros do painel React.
    """
    dados_dashboard = {}

    with connection.cursor() as cursor:
        
        # 👑 1. FILTRO: Os 10 Melhores Alunos (Média Global + Assiduidade)
        cursor.execute("""
            SELECT 
                aluno_id AS id,
                aluno_nome AS nome,
                ROUND(AVG(nota), 2) AS media_global,
                SUM(faltas) AS total_faltas
            FROM view_dashboard_analitica
            WHERE turma_id = %s AND aluno_situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            ORDER BY media_global DESC, total_faltas ASC
            LIMIT 10;
        """, [turma_id])
        colunas_top = [col[0] for col in cursor.description]
        dados_dashboard['top_alunos'] = [dict(zip(colunas_top, row)) for row in cursor.fetchall()]


        # ⚠️ 2. FILTRO: Alunos em Recuperação Crítica (Média Global < 6.0)
        cursor.execute("""
            SELECT 
                aluno_id AS id,
                aluno_nome AS nome,
                ROUND(AVG(nota), 2) AS media_global,
                SUM(faltas) AS total_faltas
            FROM view_dashboard_analitica
            WHERE turma_id = %s AND aluno_situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            HAVING AVG(nota) < 6.0
            ORDER BY media_global ASC;
        """, [turma_id])
        colunas_rec = [col[0] for col in cursor.description]
        dados_dashboard['alunos_recuperacao'] = [dict(zip(colunas_rec, row)) for row in cursor.fetchall()]


        # 🚨 3. FILTRO: Alunos que Precisam de Atenção Urgente (Evasão / Faltas Elevadas)
        cursor.execute("""
            SELECT 
                aluno_id AS id,
                aluno_nome AS nome,
                ROUND(AVG(nota), 2) AS media_global,
                SUM(faltas) AS total_faltas
            FROM view_dashboard_analitica
            WHERE turma_id = %s AND aluno_situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            HAVING SUM(faltas) >= 20 OR AVG(nota) < 5.0
            ORDER BY total_faltas DESC;
        """, [turma_id])
        colunas_aten = [col[0] for col in cursor.description]
        dados_dashboard['alunos_atencao'] = [dict(zip(colunas_aten, row)) for row in cursor.fetchall()]


        # 📈 4. KPIs Gerais da Turma (Cards do Topo do Painel)
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT aluno_id) AS qtd_alunos,
                ROUND(AVG(nota), 2) AS media_geral_turma
            FROM view_dashboard_analitica
            WHERE turma_id = %s;
        """, [turma_id])
        colunas_kpi = [col_desc[0] for col_desc in cursor.description]
        res_kpi = cursor.fetchone()
        dados_dashboard['kpis'] = dict(zip(colunas_kpi, res_kpi)) if res_kpi else {}

    return JsonResponse(dados_dashboard, safe=False)


@api_view(['GET'])
def radar_aluno_disciplinas(request, aluno_id):
    """
    Endpoint exclusivo para alimentar o Gráfico de Radar (Pentágono) do Recharts.
    Garante mapeamento explícito de colunas para evitar incompatibilidade.
    """
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                disciplina_nome,
                nota
            FROM view_dashboard_analitica
            WHERE aluno_id = %s;
        """, [aluno_id])
        
        linhas = cursor.fetchall()
        
        # Monta o formato exato que o Recharts consome: subject, A (nota), B (corte)
        dados_radar = []
        for linha in linhas:
            dados_radar.append({
                'subject': linha[0],       # Nome da disciplina (ex: BACK-END)
                'A': float(linha[1] or 0), # Nota do aluno transformada em float
                'B': 6.0                   # Média escolar padrão de corte
            })
        
    return JsonResponse(dados_radar, safe=False)




@csrf_exempt  # Desabilita a checagem CSRF para permitir requisições diretas do React
def registrar_nota(request):
    if request.method == 'POST':
        try:
            dados = json.loads(request.body)
            aluno_id = dados.get('aluno_id')
            disciplina_id = dados.get('disciplina_id')
            nota = dados.get('nota')
            faltas = dados.get('faltas', 0)

            with connection.cursor() as cursor:
                # Como estamos usando SQLite localmente, a sintaxe correta para o "Insert or Update" é INSERT OR REPLACE
                cursor.execute("""
                    INSERT OR REPLACE INTO interstate_boletim (id, aluno_id, disciplina_id, nota, faltas)
                    VALUES (
                        (SELECT id FROM interstate_boletim WHERE aluno_id = %s AND disciplina_id = %s),
                        %s, %s, %s, %s
                    );
                """, [aluno_id, disciplina_id, aluno_id, disciplina_id, nota, faltas])

            return JsonResponse({'status': 'sucesso', 'mensagem': 'Nota integrada com sucesso!'})
        except Exception as e:
            return JsonResponse({'status': 'erro', 'mensagem': str(e)}, status=400)
            
    return JsonResponse({'status': 'erro', 'mensagem': 'Método não permitido'}, status=405)