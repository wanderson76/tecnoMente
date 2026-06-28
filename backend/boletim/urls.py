from django.urls import path
from .views import query_dashboard_analytics, listar_turmas

urlpatterns = [
    path('turmas/', listar_turmas, name='listar_turmas'),
    path('analytics/<int:turma_id>/', query_dashboard_analytics, name='query_dashboard_analytics'),
]