from django.urls import path
from .views import dashboard_analytics_completo, radar_aluno_disciplinas, listar_turmas

from . import views

urlpatterns = [
    path('turmas/', listar_turmas, name='listar_turmas'),
    path('analytics/turma/<int:turma_id>/', dashboard_analytics_completo, name='dashboard_analytics'),
    path('analytics/aluno/<int:aluno_id>/radar/', radar_aluno_disciplinas, name='radar_aluno'),
    path('boletim/registrar/', views.registrar_nota, name='registrar_nota'),
   
]


