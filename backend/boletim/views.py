from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Turma, RegistroBoletim # Corrigido aqui

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
    Endpoint corrigido que busca os dados diretamente das tabelas do Django
    usando as colunas corretas (media_final e faltas).
    """
    dados_dashboard = {}

    with connection.cursor() as cursor:
        
        # 👑 1. FILTRO: Os 10 Melhores Alunos (Média Global + Assiduidade)
        cursor.execute("""
            SELECT 
                a.id AS id,
                a.nome AS nome,
                ROUND(AVG(rb.media_final), 2) AS media_global,
                SUM(rb.faltas) AS total_faltas
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s AND a.situacao = 'Ativo'
            GROUP BY a.id, a.nome
            ORDER BY media_global DESC, total_faltas ASC
            LIMIT 10;
        """, [turma_id])
        colunas_top = [col[0] for col in cursor.description]
        dados_dashboard['top_alunos'] = [dict(zip(colunas_top, row)) for row in cursor.fetchall()]


        # ⚠️ 2. FILTRO: Alunos em Recuperação Crítica (Média Global < 6.0)
        cursor.execute("""
            SELECT 
                a.id AS id,
                a.nome AS nome,
                ROUND(AVG(rb.media_final), 2) AS media_global,
                SUM(rb.faltas) AS total_faltas
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s AND a.situacao = 'Ativo'
            GROUP BY a.id, a.nome
            HAVING AVG(rb.media_final) < 6.0
            ORDER BY media_global ASC;
        """, [turma_id])
        colunas_rec = [col[0] for col in cursor.description]
        dados_dashboard['alunos_recuperacao'] = [dict(zip(colunas_rec, row)) for row in cursor.fetchall()]


        # 🚨 3. FILTRO: Alunos que Precisam de Atenção Urgente (Evasão / Faltas Elevadas)
        cursor.execute("""
            SELECT 
                a.id AS id,
                a.nome AS nome,
                ROUND(AVG(rb.media_final), 2) AS media_global,
                SUM(rb.faltas) AS total_faltas
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s AND a.situacao = 'Ativo'
            GROUP BY a.id, a.nome
            HAVING SUM(rb.faltas) >= 20 OR AVG(rb.media_final) < 5.0
            ORDER BY total_faltas DESC;
        """, [turma_id])
        colunas_aten = [col[0] for col in cursor.description]
        dados_dashboard['alunos_atencao'] = [dict(zip(colunas_aten, row)) for row in cursor.fetchall()]


        # 📈 4. KPIs Gerais da Turma (Cards do Topo do Painel)
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT rb.aluno_id) AS qtd_alunos,
                ROUND(AVG(rb.media_final), 2) AS media_geral_turma
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s;
        """, [turma_id])
        colunas_kpi = [col_desc[0] for col_desc in cursor.description]
        res_kpi = cursor.fetchone()
        dados_dashboard['kpis'] = dict(zip(colunas_kpi, res_kpi)) if res_kpi else {}

    return JsonResponse(dados_dashboard, safe=False)


@api_view(['GET'])
def radar_aluno_disciplinas(request, aluno_id):
    """
    Endpoint corrigido mapeando para as tabelas reais do banco.
    """
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                d.nome AS disciplina_nome,
                rb.media_final AS nota
            FROM boletim_registroboletim rb
            INNER JOIN boletim_disciplina d ON rb.disciplina_id = d.id
            WHERE rb.aluno_id = %s;
        """, [aluno_id])
        
        linhas = cursor.fetchall()
        
        dados_radar = []
        for linha in linhas:
            dados_radar.append({
                'subject': linha[0],       
                'A': float(linha[1] or 0), 
                'B': 6.0                   
            })
        
    return JsonResponse(dados_radar, safe=False)



@csrf_exempt  
@api_view(['POST'])
def registrar_nota(request):
    """
    Registra ou atualiza as notas/faltas usando o modelo correto: RegistroBoletim.
    """
    try:
        dados = json.loads(request.body)
        aluno_id = dados.get('aluno_id')
        disciplina_id = dados.get('disciplina_id')
        nota = dados.get('nota')
        faltas = dados.get('faltas', 0)
        bimestre = dados.get('bimestre', 2) # Padrão do seu model é 2

        # Corrigido para usar RegistroBoletim e o campo media_final
        from .models import RegistroBoletim 

        RegistroBoletim.objects.update_or_create(
            aluno_id=aluno_id,
            disciplina_id=disciplina_id,
            bimestre=bimestre,
            defaults={
                'media_final': nota, # Seu model usa media_final, não nota
                'faltas': faltas
            }
        )

        return JsonResponse({'status': 'sucesso', 'mensagem': 'Nota integrada com sucesso!'})
    except Exception as e:
        return JsonResponse({'status': 'erro', 'mensagem': str(e)}, status=400)