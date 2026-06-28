from django.db import models

class Escola(models.Model):
    nome = models.CharField(max_length=255, unique=True)
    def __str__(self): return self.nome

class Turma(models.Model):
    escola = models.ForeignKey(Escola, on_delete=models.CASCADE, related_name='turmas')
    codigo = models.CharField(max_length=100) # Ex: "3ª SERIE C", "2º ANO C"
    def __str__(self): return f"{self.escola.nome} - {self.codigo}"

class Aluno(models.Model):
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name='alunos')
    nome = models.CharField(max_length=255)
    situacao = models.CharField(max_length=50, default='Ativo')
    def __str__(self): return self.nome

class Disciplina(models.Model):
    nome = models.CharField(max_length=150, unique=True)
    def __str__(self): return self.nome

class RegistroBoletim(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='boletins')
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE)
    bimestre = models.IntegerField(default=2)
    
    # Detalhes parciais dos seus CSVs de Avaliação
    prova_paulista = models.FloatField(null=True, blank=True)
    avaliacao = models.FloatField(null=True, blank=True)
    trabalho = models.FloatField(null=True, blank=True)
    conceito = models.FloatField(null=True, blank=True)
    
    # Nota consolidada e faltas (dos CSVs de Fechamento)
    media_final = models.FloatField()
    faltas = models.IntegerField(default=0)

    class Meta:
        unique_together = ('aluno', 'disciplina', 'bimestre')