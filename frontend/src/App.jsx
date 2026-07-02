import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RadarAluno } from './components/RadarAluno';

// Definição dinâmica da URL da API (Local vs Produção Railway)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://tecnomente-production.up.railway.app';

// Cores neon estruturadas para os componentes técnicos
const CORES_DISCIPLINAS = {
  'BACK-END': '#a855f7',      // Purple
  'FRONT-END': '#22d3ee',     // Cyan
  'BANCO DE DADOS': '#34d399' // Emerald
};

// Centralização dos objetos de estilo (limpa o escopo do componente)
const ESTILOS = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#030712',
    backgroundImage: 'radial-gradient(circle at top, #0f1123 0%, #030712 70%, #050508 100%)',
    color: '#f1f5f9',
    padding: '1.5rem',
    fontFamily: 'sans-serif'
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '1rem',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  }
};

function App() {
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [alunoIdParaRadar, setAlunoIdParaRadar] = useState(null);
  const [loading, setLoading] = useState(false);

  // Busca inicial das turmas cadastradas
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/turmas/`)
      .then(res => {
        setTurmas(res.data);
        if (res.data && res.data.length > 0) {
          setTurmaSelecionada(res.data[0].id);
        }
      })
      .catch(err => console.error("Erro ao buscar turmas:", err));
  }, []);

  // Função isolada e memoizada para carregar/atualizar dados da turma
  const carregarAnalytics = useCallback((idTurma) => {
    if (!idTurma) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/analytics/turma/${idTurma}/`)
      .then(res => {
        setAnalytics(res.data);
        if (res.data && res.data.top_alunos?.length > 0) {
          setAlunoIdParaRadar(res.data.top_alunos[0].id);
        } else {
          setAlunoIdParaRadar(null);
        }
      })
      .catch(err => console.error("Erro ao buscar analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  // Gatilho executado sempre que a turma selecionada for alterada
  useEffect(() => {
    if (turmaSelecionada) {
      carregarAnalytics(turmaSelecionada);
    }
  }, [turmaSelecionada, carregarAnalytics]);

  // Handler para envio do formulário de novas avaliações
  const handleRegistrarNota = (e) => {
    e.preventDefault();
    const form = e.target;
    
    const formData = {
      aluno_id: form.aluno.value,
      disciplina_id: form.disciplina.value,
      nota: parseFloat(form.nota.value),
      faltas: parseInt(form.faltas.value)
    };
    
    axios.post(`${API_BASE_URL}/api/boletim/registrar/`, formData)
      .then(() => {
        alert('Nota integrada ao banco com sucesso! Atualizando métricas...');
        form.reset();
        carregarAnalytics(turmaSelecionada);
      })
      .catch(err => alert('Erro ao salvar registro: ' + err.message));
  };

  return (
    <div style={ESTILOS.container}>
      
      {/* HEADER EM ESTILO VIDRO */}
      <header style={{ ...ESTILOS.glass, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            EduAnalytica • Painel do Professor
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>Análise preditiva de rendimento escolar baseado em dados reais do banco.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Turma:</label>
          <select 
            value={turmaSelecionada}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#22d3ee', borderRadius: '0.5rem', padding: '0.4rem 1rem', outline: 'none', cursor: 'pointer' }}
          >
            {turmas.length === 0 ? (
              <option value="">Nenhuma turma cadastrada</option>
            ) : (
              turmas.map(t => (
                <option key={t.id} value={t.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>{t.codigo} - {t.escola}</option>
              ))
            )}
          </select>
        </div>
      </header>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#22d3ee', fontWeight: '600' }}>Carregando métricas...</div>}

      {!loading && !analytics && !turmaSelecionada && (
        <div style={{ ...ESTILOS.glass, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
          Nenhuma turma selecionada ou dados não encontrados no banco. Comece cadastrando uma turma no painel admin.
        </div>
      )}

      {!loading && analytics && (
        <div>
          {/* CARDS KPIs DO TOPO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ ...ESTILOS.glass, borderLeft: '4px solid #3b82f6', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Total de Alunos Monitorados</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', marginTop: '0.5rem' }}>{analytics.kpis?.qtd_alunos || 0}</h2>
            </div>
            <div style={{ ...ESTILOS.glass, borderLeft: '4px solid #34d399', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Média Geral da Turma</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#34d399', marginTop: '0.5rem' }}>
                {analytics.kpis?.media_geral_turma || '0.0'}
              </h2>
            </div>
          </div>

          {/* DESEMPENHO POR COMPONENTE CURRICULAR */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '1rem', paddingLeft: '0.25rem' }}>
            📊 Desempenho por Componente Curricular
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {analytics.medias_por_disciplina?.map((disc, idx) => {
              const corNeon = CORES_DISCIPLINAS[disc.nome.toUpperCase()] || '#22d3ee';
              const porcenBarra = Math.min((disc.media / 10) * 100, 100);
              return (
                <div key={idx} style={{ ...ESTILOS.glass, borderTop: `3px solid ${corNeon}`, marginBottom: 0, padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{disc.nome}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#fff' }}>{disc.media}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: disc.media >= 5 ? '#34d399' : '#f43f5e' }}>
                      {disc.media >= 5 ? '✓ Estável' : '🚨 Atenção'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ width: `${porcenBarra}%`, height: '100%', backgroundColor: corNeon, borderRadius: '2px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GRID DE CONTEÚDO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* TABELAS */}
            <div style={{ gridColumn: 'span 2' }}>
              
              {/* TOP 10 */}
              <div style={ESTILOS.glass}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#22d3ee', marginBottom: '1rem' }}>🏆 Top Alunos da Turma</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ paddingBottom: '0.75rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Aluno</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Média</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Faltas</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_alunos?.map(aluno => (
                      <tr key={aluno.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: '500' }}>{aluno.nome}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center', color: '#22d3ee', fontWeight: '700' }}>{aluno.media_global}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center', color: '#94a3b8' }}>{aluno.total_faltas}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                          <button 
                            onClick={() => setAlunoIdParaRadar(aluno.id)}
                            style={{ backgroundColor: alunoIdParaRadar === aluno.id ? '#22d3ee' : 'rgba(255,255,255,0.05)', color: alunoIdParaRadar === aluno.id ? '#030712' : '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
                          >
                            Ver Radar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RECUPERAÇÃO */}
              <div style={ESTILOS.glass}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f43f5e', marginBottom: '1rem' }}>⚠️ Alunos em Recuperação Crítica</h3>
                {analytics.alunos_recuperacao?.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nenhum aluno com nota deficitária nesta turma! 🎉</p>
                ) : (
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <tbody>
                      {analytics.alunos_recuperacao?.map(aluno => (
                        <tr key={aluno.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0' }}>
                            <div style={{ fontWeight: '500' }}>{aluno.nome}</div>
                            <div style={{ fontSize: '0.75rem', color: '#fda4af', marginTop: '0.25rem', backgroundColor: 'rgba(159,18,57,0.3)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', display: 'inline-block' }}>
                              🚨 Foco: {aluno.materias_recuperacao}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0', textAlign: 'center', color: '#f43f5e', fontWeight: '700', width: '4rem' }}>{aluno.media_global}</td>
                          <td style={{ padding: '0.75rem 0', textAlign: 'center', width: '5rem' }}>
                            <button 
                              onClick={() => setAlunoIdParaRadar(aluno.id)}
                              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Analisar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

            {/* GRÁFICO RADAR CHART */}
            <div>
              {/* Passando a prop apiBaseUrl para resolver o problema de requisições fixas */}
              <RadarAluno alunoId={alunoIdParaRadar} apiBaseUrl={API_BASE_URL} />
            </div>

          </div>

          {/* FORMULÁRIO DE LANÇAMENTO RÁPIDO */}
          <div style={{ ...ESTILOS.glass, marginTop: '2rem', borderLeft: '4px solid #22d3ee' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#22d3ee', marginBottom: '0.5rem' }}>
              ⚡ Lançamento Rápido de Notas
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Insira uma nova avaliação. O banco executará o recálculo imediato do Dashboard e do Pentágono Técnico.
            </p>
            
            <form onSubmit={handleRegistrarNota} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>SELECIONAR ALUNO</label>
                <select name="aluno" required style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none' }}>
                  {analytics.top_alunos?.concat(analytics.alunos_recuperacao || []).map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>COMPONENTE</label>
                <select name="disciplina" required style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none' }}>
                  <option value="1">BACK-END</option>
                  <option value="2">FRONT-END</option>
                  <option value="3">BANCO DE DADOS</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>NOTA (0.0 - 10.0)</label>
                <input type="number" step="0.1" min="0" max="10" name="nota" required style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>FALTAS</label>
                <input type="number" min="0" name="faltas" defaultValue="0" required style={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none' }} />
              </div>

              <button type="submit" style={{ backgroundColor: '#22d3ee', color: '#030712', border: 'none', padding: '0.6rem', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>
                Salvar Registro
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;