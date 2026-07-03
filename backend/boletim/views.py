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
    Endpoint com tipagem explícita (COALESCE e CAST) para garantir 
    compatibilidade 100% estrita com o PostgreSQL da Railway.
    """
    dados_dashboard = {}

    with connection.cursor() as cursor:
        
        # 👑 1. FILTRO: Os 10 Melhores Alunos
        cursor.execute("""
            SELECT 
                a.id AS id,
                a.nome AS nome,
                COALESCE(ROUND(AVG(rb.media_final)::numeric, 2), 0.0) AS media_global,
                COALESCE(SUM(rb.faltas), 0) AS total_faltas
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
                COALESCE(ROUND(AVG(rb.media_final)::numeric, 2), 0.0) AS media_global,
                COALESCE(SUM(rb.faltas), 0) AS total_faltas
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s AND a.situacao = 'Ativo'
            GROUP BY a.id, a.nome
            HAVING AVG(rb.media_final) < 6.0
            ORDER BY media_global ASC;
        """, [turma_id])
        colunas_rec = [col[0] for col in cursor.description]
        
        alunos_rec = []
        for row in cursor.fetchall():
            item = dict(zip(colunas_rec, row))
            item['materias_recuperacao'] = "Geral"  
            alunos_rec.append(item)
        dados_dashboard['alunos_recuperacao'] = alunos_rec


        # 🚨 3. FILTRO: Alunos que Precisam de Atenção Urgente
        cursor.execute("""
            SELECT 
                a.id AS id,
                a.nome AS nome,
                COALESCE(ROUND(AVG(rb.media_final)::numeric, 2), 0.0) AS media_global,
                COALESCE(SUM(rb.faltas), 0) AS total_faltas
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s AND a.situacao = 'Ativo'
            GROUP BY a.id, a.nome
            HAVING SUM(rb.faltas) >= 20 OR AVG(rb.media_final) < 5.0
            ORDER BY total_faltas DESC;
        """, [turma_id])
        colunas_aten = [col[0] for col in cursor.description]
        dados_dashboard['alunos_atencao'] = [dict(zip(colunas_aten, row)) for row in cursor.fetchall()]


        # 📈 4. KPIs Gerais da Turma
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT rb.aluno_id) AS qtd_alunos,
                COALESCE(ROUND(AVG(rb.media_final)::numeric, 2), 0.0) AS media_geral_turma
            FROM boletim_registroboletim rb
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s;
        """, [turma_id])
        colunas_kpi = [col_desc[0] for col_desc in cursor.description]
        res_kpi = cursor.fetchone()
        dados_dashboard['kpis'] = dict(zip(colunas_kpi, res_kpi)) if res_kpi else {"qtd_alunos": 0, "media_geral_turma": 0.0}


        # 📊 5. Média por Disciplina
        cursor.execute("""
            SELECT 
                d.nome AS nome,
                COALESCE(ROUND(AVG(rb.media_final)::numeric, 2), 0.0) AS media
            FROM boletim_registroboletim rb
            INNER JOIN boletim_disciplina d ON rb.disciplina_id = d.id
            INNER JOIN boletim_aluno a ON rb.aluno_id = a.id
            WHERE a.turma_id = %s
            GROUP BY d.nome;
        """, [turma_id])
        colunas_disc = [col[0] for col in cursor.description]
        dados_dashboard['medias_por_disciplina'] = [dict(zip(colunas_disc, row)) for row in cursor.fetchall()]

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