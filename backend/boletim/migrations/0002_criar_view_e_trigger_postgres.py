from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('boletim', '0001_initial'), # Garante que roda DEPOIS que as tabelas padrões forem criadas
    ]

    operations = [
        # 1. Criação da View Analítica
        migrations.RunSQL("""
            CREATE OR REPLACE VIEW view_dashboard_analitica AS
            SELECT 
                e.nome AS escola_nome,
                t.id AS turma_id,
                t.codigo AS turma_codigo,
                a.id AS aluno_id,
                a.nome AS aluno_nome,
                a.situacao AS aluno_situacao,
                d.nome AS disciplina_nome,
                b.media_final AS nota,
                b.faltas AS faltas,
                CASE 
                    WHEN b.media_final < 6.0 AND b.faltas >= 20 THEN 'Crítico'
                    WHEN b.media_final < 6.0 THEN 'Recuperação Nota'
                    WHEN b.faltas >= 20 THEN 'Risco Frequência'
                    ELSE 'Regular'
                END AS status_disciplina
            FROM boletim_registroboletim b
            JOIN boletim_aluno a ON b.aluno_id = a.id
            JOIN boletim_turma t ON a.turma_id = t.id
            JOIN boletim_escola e ON t.escola_id = e.id
            JOIN boletim_disciplina d ON b.disciplina_id = d.id;
        """, reverse_sql="DROP VIEW IF EXISTS view_dashboard_analitica;"),

        # 2. Criação da Função da Trigger (Sintaxe PL/pgSQL)
        migrations.RunSQL("""
            CREATE OR REPLACE FUNCTION fn_atualiza_status_aluno()
            RETURNS TRIGGER AS $$
            BEGIN
                IF (SELECT SUM(faltas) FROM boletim_registroboletim WHERE aluno_id = NEW.aluno_id) > 25 THEN
                    UPDATE boletim_aluno 
                    SET situacao = 'Atenção - Frequência'
                    WHERE id = NEW.aluno_id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """, reverse_sql="DROP FUNCTION IF EXISTS fn_atualiza_status_aluno();"),

        # 3. Associação da Função à Tabela via Trigger
        migrations.RunSQL("""
            DROP TRIGGER IF EXISTS trg_atualiza_status_aluno ON boletim_registroboletim;
            CREATE TRIGGER trg_atualiza_status_aluno
            AFTER UPDATE ON boletim_registroboletim
            FOR EACH ROW
            EXECUTE FUNCTION fn_atualiza_status_aluno();
        """, reverse_sql="DROP TRIGGER IF EXISTS trg_atualiza_status_aluno ON boletim_registroboletim;")
    ]