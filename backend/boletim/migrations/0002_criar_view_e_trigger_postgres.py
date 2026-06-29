from django.db import migrations

def criar_views_e_triggers(apps, schema_editor):
    # Detecta se o banco local é o SQLite. Se for, ignora o SQL do Postgres.
    if 'sqlite' in schema_editor.connection.vendor:
        print("\n--> [SQLite Detectado]: Pulando criação de Triggers/Views nativas do Postgres no ambiente local.")
        return

    # Se cair aqui, significa que está rodando no Postgres (ex: Production no Railway)
    cursor = schema_editor.connection.cursor()
    
    # 1. Criação da View Analítica no Postgres (Mapeamento Corrigido)
    cursor.execute("""
        CREATE OR REPLACE VIEW view_dashboard_analitica AS
        SELECT 
            t.id AS turma_id,
            a.id AS aluno_id,
            a.nome AS nome_aluno,
            b.media_final,  -- <-- CORRIGIDO: de b.nota para b.media_final
            b.faltas,
            b.bimestre
        FROM boletim_turma t
        JOIN boletim_aluno a ON a.turma_id = t.id
        LEFT JOIN boletim_registroboletim b ON b.aluno_id = a.id; -- <-- CORRIGIDO: nome real da tabela
    """)
    
    # 2. Exemplo de Trigger ou Função customizada que você tenha no Postgres
    # (Adicione aqui suas outras queries nativas se houver, protegidas pelo IF)


def remover_views_e_triggers(apps, schema_editor):
    if 'sqlite' in schema_editor.connection.vendor:
        return
        
    cursor = schema_editor.connection.cursor()
    cursor.execute("DROP VIEW IF EXISTS view_dashboard_analitica CASCADE;")


class Migration(migrations.Migration):

    dependencies = [
        ('boletim', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(criar_views_e_triggers, reverse_code=remover_views_e_triggers),
    ]