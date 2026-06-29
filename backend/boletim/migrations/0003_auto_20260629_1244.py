from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('boletim', '0001_initial'), # Nome da sua primeira migração
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE VIEW view_dashboard_analitica AS
            SELECT 
                -- COLOQUE AQUI A CONSULTA ORIGINAL DA SUA VIEW
                -- Exemplo: aluno.id, nota.valor, turma.id...
            ;
            """,
            reverse_sql="DROP VIEW IF EXISTS view_dashboard_analitica;"
        )
    ]