from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view

@api_view(['GET'])
def query_dashboard_analytics(request, turma_id):
    with connection.cursor() as cursor:
        # Query 1: Captura Pódio Top 10 Alunos usando a nossa VIEW relacional com agrupamento por JOIN
        cursor.execute("""
            SELECT aluno_id, aluno_nome, ROUND(AVG(media_final), 2) as media_global, SUM(faltas) as total_faltas
            FROM view_dashboard_consolidado
            WHERE turma_id = %s AND situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            ORDER BY media_global DESC
            LIMIT 10;
        """, [turma_id])
        
        columns = [col[0] for col in cursor.description]
        podium_top10 = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # Query 2: Lista de Recuperação Imediata (Média Global < 6.0) via Banco
        cursor.execute("""
            SELECT aluno_id as id, aluno_nome as nome, ROUND(AVG(media_final), 2) as media, SUM(faltas) as faltas
            FROM view_dashboard_consolidado
            WHERE turma_id = %s AND situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            HAVING media < 6.0;
        """, [turma_id])
        
        columns_rec = [col[0] for col in cursor.description]
        recuperacao_lista = [dict(zip(columns_rec, row)) for row in cursor.fetchall()]

        # Query 3: Médias por Componente Técnico para o Gráfico de Barras do Front
        cursor.execute("""
            SELECT disciplina_name as name, ROUND(AVG(media_final), 2) as media
            FROM view_dashboard_consolidado
            WHERE turma_id = %s
            GROUP BY disciplina_name;
        """, [turma_id])
        
        # Correção rápida de nomenclatura de coluna para mapear direto para o Recharts
        grafico_componentes = [{"name": row[0], "media": row[1]} for row in cursor.fetchall()]

    return JsonResponse({
        'podium_top10': podium_top10,
        'recuperacao_lista': recuperacao_lista,
        'grafico_componentes': grafico_componentes,
        'total_alunos': len(podium_top10) + len(recuperacao_lista) # Estimativa dinâmica rápida
    }, safe=False)