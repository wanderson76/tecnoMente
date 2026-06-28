from django.contrib import admin
from .models import Escola, Turma, Aluno, Disciplina, RegistroBoletim

@admin.register(Escola)
class EscolaAdmin(admin.ModelAdmin):
    list_display = ('nome',)

@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'escola')
    list_filter = ('escola',)

@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'turma', 'situacao')
    list_filter = ('turma', 'situacao')
    search_fields = ('nome',)

@admin.register(Disciplina)
class DisciplinaAdmin(admin.ModelAdmin):
    list_display = ('nome',)

@admin.register(RegistroBoletim)
class RegistroBoletimAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'disciplina', 'bimestre', 'media_final', 'faltas')
    list_filter = ('disciplina', 'bimestre', 'aluno__turma')
    search_fields = ('aluno__nome',)