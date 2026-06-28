from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view
from .models import Turma

@api_view(['GET'])
def listar_turmas(request):
    """Retorna todas as turmas cadastradas para alimentar o filtro do dashboard"""
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
def query_dashboard_analytics(request, turma_id):
    """Puxa os dados consolidados direto da VIEW do banco para o React"""
    with connection.cursor() as cursor:
        # 1. Pódio Top Alunos
        cursor.execute("""
            SELECT aluno_id as id, aluno_nome as nome, ROUND(AVG(media_final), 2) as media, SUM(faltas) as faltas
            FROM view_dashboard_consolidado
            WHERE turma_id = %s AND situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            ORDER BY media DESC
            LIMIT 10;
        """, [turma_id])
        columns_top = [col[0] for col in cursor.description]
        podium_top10 = [dict(zip(columns_top, row)) for row in cursor.fetchall()]

        # 2. Lista de Alunos em Recuperação Crítica (Média < 6.0)
        cursor.execute("""
            SELECT aluno_id as id, aluno_nome as nome, ROUND(AVG(media_final), 2) as media, SUM(faltas) as faltas
            FROM view_dashboard_consolidado
            WHERE turma_id = %s AND situacao = 'Ativo'
            GROUP BY aluno_id, aluno_nome
            HAVING media < 6.0;
        """, [turma_id])
        columns_rec = [col[0] for col in cursor.description]
        recuperacao_lista = [dict(zip(columns_rec, row)) for row in cursor.fetchall()]

        # 3. Médias por Componente Curricular (Alimenta o Radar/Pentágono do Recharts)
        cursor.execute("""
            SELECT disciplina_nome as subject, ROUND(AVG(media_final), 2) as A
            FROM view_dashboard_consolidado
            WHERE turma_id = %s
            GROUP BY disciplina_nome;
        """, [turma_id])
        columns_graf = [col[0] for col in cursor.description]
        grafico_componentes = [dict(zip(columns_graf, row)) for row in cursor.fetchall()]

        # 4. Média Geral da Turma (KPI de topo)
        cursor.execute("""
            SELECT ROUND(AVG(media_final), 2) 
            FROM view_dashboard_consolidado 
            WHERE turma_id = %s;
        """, [turma_id])
        res_media = cursor.fetchone()
        media_geral = res_media[0] if res_media and res_media[0] is not None else 0.0

        # 5. Total de alunos únicos na turma
        cursor.execute("""
            SELECT COUNT(DISTINCT aluno_id) 
            FROM view_dashboard_consolidado 
            WHERE turma_id = %s;
        """, [turma_id])
        res_total = cursor.fetchone()
        total_alunos = res_total[0] if res_total and res_total[0] is not None else 0

    return JsonResponse({
        'media_geral_turma': media_geral,
        'total_alunos': total_alunos,
        'qtd_recuperacao': len(recuperacao_lista),
        'podium_top10': podium_top10,
        'recuperacao_lista': recuperacao_lista,
        'grafico_componentes': grafico_componentes
    }, safe=False)