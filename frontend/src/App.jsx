import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

// COMPONENTE: CARD DE MÉTRICA RÁPIDA (KPI)
function MetricCard({ title, value, color, icon }) {
  return (
    <div className="panel" style={{ borderLeft: `4px solid ${color}`, padding: '15px', marginBottom: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>{title}</p>
          <h2 style={{ margin: '5px 0 0 0', color: color, fontSize: '1.8rem' }}>{value}</h2>
        </div>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [turmaAtiva, setTurmaAtiva] = useState('3C'); // '3C' ou '2C'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subtitle, setSubtitle] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  // Simulação da Base de Dados Filtrada por Turma (Cruzando seus CSVs de Fechamento/Avaliação)
  // Simulação da Base de Dados Filtrada por Turma (Cruzando seus CSVs de Fechamento/Avaliação)
  const dadosPorTurma = {
    '3C': {
      nome: "3ª SÉRIE C INTEGRAL - MARIA JOSÉ",
      media_geral_turma: 7.4,
      total_alunos: 22, // CORRIGIDO: Alterado de 35 para 22 alunos
      qtd_recuperacao: 3,
      podium_top10: [
        { id: 1, nome: "ALEXIAH SILVA VALENTIM", media: 9.5, faltas: 2, notas: [{ subject: 'Back-End', value: 9.5 }, { subject: 'Lógica', value: 10 }, { subject: 'Redes', value: 9.0 }, { subject: 'Metodologias', value: 9.5 }, { subject: 'Carreira', value: 9.5 }] },
        { id: 2, nome: "ANNE CAROLINE GOMES DE SOUZA", media: 9.2, faltas: 2, notas: [{ subject: 'Back-End', value: 9.5 }, { subject: 'Lógica', value: 9.5 }, { subject: 'Redes', value: 8.5 }, { subject: 'Metodologias', value: 9.0 }, { subject: 'Carreira', value: 9.5 }] },
        { id: 3, nome: "DAVIS OURA DANTAS", media: 8.9, faltas: 2, notas: [{ subject: 'Back-End', value: 9.5 }, { subject: 'Lógica', value: 8.5 }, { subject: 'Redes', value: 8.5 }, { subject: 'Metodologias', value: 9.0 }, { subject: 'Carreira', value: 9.0 }] },
        { id: 4, nome: "JHONATA RAFAEL PRADO NASCIMENTO", media: 8.5, faltas: 1, notas: [{ subject: 'Back-End', value: 8.5 }, { subject: 'Lógica', value: 9.0 }, { subject: 'Redes', value: 8.0 }, { subject: 'Metodologias', value: 8.5 }, { subject: 'Carreira', value: 9.0 }] }
      ],
      recuperacao_lista: [
        { id: 9, nome: "GABRIEL SORIANO APARECIDO DE OLIVEIRA", media: 0.0, faltas: 12, notas: [{ subject: 'Back-End', value: 0 }, { subject: 'Lógica', value: 0 }, { subject: 'Redes', value: 0 }, { subject: 'Metodologias', value: 0 }, { subject: 'Carreira', value: 0 }] },
        { id: 4, nome: "CAIO BARSOTTI MARTINS", media: 5.5, faltas: 6, notas: [{ subject: 'Back-End', value: 5.5 }, { subject: 'Lógica', value: 6.0 }, { subject: 'Redes', value: 5.0 }, { subject: 'Metodologias', value: 5.5 }, { subject: 'Carreira', value: 5.5 }] }
      ],
      grafico_componentes: [
        { name: 'Back-End', media: 7.8 }, { name: 'Lógica', media: 7.5 }, { name: 'Redes', media: 6.9 }, { name: 'Metodologias', media: 7.4 }, { name: 'Carreira', media: 7.2 }
      ]
    },
    '2C': {
      nome: "2º ANO C - WALKIR VERGANI",
      media_geral_turma: 6.2,
      total_alunos: 38,
      qtd_recuperacao: 6,
      podium_top10: [
        { id: 101, nome: "CLEVERTON DE OLIVEIRA SANTOS", media: 9.1, faltas: 4, notas: [{ subject: 'Back-End', value: 8.5 }, { subject: 'Lógica', value: 9.5 }, { subject: 'Redes', value: 10 }, { subject: 'Metodologias', value: 8.8 }, { subject: 'Carreira', value: 9.0 }] },
        { id: 102, nome: "EVELLYN CRUZ DA SILVA", media: 8.4, faltas: 3, notas: [{ subject: 'Back-End', value: 8.0 }, { subject: 'Lógica', value: 8.0 }, { subject: 'Redes', value: 9.0 }, { subject: 'Metodologias', value: 8.1 }, { subject: 'Carreira', value: 8.8 }] },
        { id: 103, nome: "JENNIFER RIKELLY ROCHA CONCEICAO", media: 8.3, faltas: 1, notas: [{ subject: 'Back-End', value: 7.8 }, { subject: 'Lógica', value: 8.5 }, { subject: 'Redes', value: 8.5 }, { subject: 'Metodologias', value: 8.3 }, { subject: 'Carreira', value: 8.5 }] }
      ],
      recuperacao_lista: [
        { id: 104, nome: "ANJOLITA APARECIDA GALDINO MORAIS", media: 4.6, faltas: 9, notas: [{ subject: 'Back-End', value: 5.1 }, { subject: 'Lógica', value: 5.0 }, { subject: 'Redes', value: 4.8 }, { subject: 'Metodologias', value: 3.4 }, { subject: 'Carreira', value: 5.1 }] },
        { id: 105, nome: "DAVID SILVA RAMOS DOS SANTOS", media: 5.1, faltas: 8, notas: [{ subject: 'Back-End', value: 5.5 }, { subject: 'Lógica', value: 6.0 }, { subject: 'Redes', value: 7.0 }, { subject: 'Metodologias', value: 3.3 }, { subject: 'Carreira', value: 3.9 }] }
      ],
      grafico_componentes: [
        { name: 'Back-End', media: 6.1 }, { name: 'Lógica', media: 6.4 }, { name: 'Redes', media: 5.8 }, { name: 'Metodologias', media: 6.2 }, { name: 'Carreira', media: 6.5 }
      ]
    }
  };
  const currentData = dadosPorTurma[turmaAtiva];

  useEffect(() => {
    const fullText = `> BI Ativo: Monitoramento de Matrizes de Desempenho Técnico_`;
    let index = 0;
    setSubtitle('');
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setSubtitle((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [turmaAtiva]);

  return (
    <>
      <div className="scanlines"></div>
      <div className="main-container">
        
        {/* HEADER */}
        <header className="cyber-header">
          <div className="profile-area">
            <div className="profile-pic-frame">
              {/* Alterado aqui para apontar para a raiz da pasta public */}
              <img src="/robo.jpg" alt="Avatar Core" className="profile-pic" />
            </div>
          </div>
          <div className="title-area">
            <h1 className="glitch-title" data-text="> TECNOMENTE.BI_">&gt; TECNOMENTE.BI_</h1>
            <p className="cyber-subtitle" style={{ minHeight: '20px' }}>{subtitle}</p>
          </div>
          
          {/* SELETOR DE TURMA ULTRA-VISUAL */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button className={`nav-btn ${turmaAtiva === '3C' ? 'active' : ''}`} onClick={() => { setTurmaAtiva('3C'); setAlunoSelecionado(null); }}>3ª SÉRIE C</button>
            <button className={`nav-btn ${turmaAtiva === '2C' ? 'active' : ''}`} onClick={() => { setTurmaAtiva('2C'); setAlunoSelecionado(null); }}>2º ANO C</button>
          </div>
        </header>
        <h3 style={{ color: 'var(--neon-cyan)', margin: '10px 0 20px 0', letterSpacing: '1px' }}>
          📌 ATUAL: {currentData.nome}
        </h3>

        {/* METRIC CARDS COMPACTOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <MetricCard title="MÉDIA DA TURMA" value={currentData.media_geral_turma} color="var(--neon-cyan)" icon="📊" />
          <MetricCard title="TOTAL DE ESTUDANTES" value={currentData.total_alunos} color="var(--neon-green)" icon="👥" />
          <MetricCard title="ALERTA DE RETENÇÃO" value={currentData.qtd_recuperacao} color="var(--neon-pink)" icon="🚨" />
        </div>

        {/* SE ALUNO SELECIONADO -> MOSTRA MODAL/PAINEL COMPACTO COM GRÁFICO PENTAGONAL */}
        {alunoSelecionado && (
          <section className="panel" style={{ borderColor: 'var(--neon-cyan)', marginBottom: '25px', background: 'rgba(0, 243, 255, 0.03)' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="panel-icon">🔷</span>
                <h2>Matriz Pentagonal de Engajamento: <span style={{ color: 'var(--neon-cyan)' }}>{alunoSelecionado.nome}</span></h2>
              </div>
              <button className="nav-btn" style={{ fontSize: '11px', padding: '2px 8px', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }} onClick={() => setAlunoSelecionado(null)}>
                FECHAR_ANÁLISE [X]
              </button>
            </div>
            <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'center', marginTop: '15px' }}>
              
              {/* LADO ESQUERDO: O PENTÁGONO */}
              <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" r="80%" data={alunoSelecionado.notas}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--neon-cyan)" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#444" style={{ fontSize: '10px' }} />
                    <Radar name={alunoSelecionado.nome} dataKey="value" stroke="var(--neon-cyan)" fill="var(--neon-cyan)" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: 'var(--neon-cyan)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* LADO DIREITO: SUMMARY METRICS CARD */}
              <div style={{ padding: '0 20px' }}>
                <h3 style={{ color: '#fff', marginBottom: '15px' }}>Análise Crítica do Conselho</h3>
                <p className="terminal-text" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                  O estudante apresenta uma média integrada de <strong>{alunoSelecionado.media}</strong> com um total de <strong>{alunoSelecionado.faltas} faltas</strong> registradas neste bimestre. O vértice do pentágono reflete a proficiência em tempo real extraída diretamente do fechamento da SED.
                </p>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <span className="badge" style={{ borderColor: alunoSelecionado.media >= 6 ? 'var(--neon-green)' : 'var(--neon-pink)', color: alunoSelecionado.media >= 6 ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
                    {alunoSelecionado.media >= 6 ? 'DESEMPENHO_ESTÁVEL' : 'PLANO_DE_RECUPERAÇÃO_IMEDIATO'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* NAVEGAÇÃO INTERNA */}
        <nav className="cyber-nav">
          <ul>
            <li><button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Métricas do Componente</button></li>
            <li><button className={`nav-btn ${activeTab === 'podium' ? 'active' : ''}`} onClick={() => setActiveTab('podium')}>👑 Pódio Top 10</button></li>
            <li><button className={`nav-btn ${activeTab === 'recuperacao' ? 'active' : ''}`} onClick={() => setActiveTab('recuperacao')}>⚠️ Alertas Retenção</button></li>
          </ul>
        </nav>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="content-grid" style={{ gridTemplateColumns: activeTab === 'dashboard' ? '1fr' : '1fr' }}>
          
          {/* TAB 1: VISÃO GERAL DAS DISCIPLINAS */}
          {activeTab === 'dashboard' && (
            <section className="panel">
              <div className="panel-header">
                <span className="panel-icon">📈</span>
                <h2>Média Consolidada por Componente</h2>
              </div>
              <div className="panel-body" style={{ height: '260px', marginTop: '15px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData.grafico_componentes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="var(--neon-cyan)" />
                    <YAxis stroke="var(--neon-cyan)" domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: 'var(--neon-cyan)' }} />
                    <Bar dataKey="media" fill="var(--neon-cyan)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* TAB 2: PÓDIO REATIVO COM CLIQUE */}
          {activeTab === 'podium' && (
            <section className="panel">
              <div className="panel-header">
                <h2>Pódio de Desempenho Técnico (Clique no Aluno para Ver o Pentágono)</h2>
              </div>
              <div className="panel-body" style={{ marginTop: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--neon-green)', textAlign: 'left', color: 'var(--neon-green)' }}>
                      <th style={{ padding: '10px' }}>Posição</th>
                      <th style={{ padding: '10px' }}>Estudante</th>
                      <th style={{ padding: '10px' }}>Média Global</th>
                      <th style={{ padding: '10px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.podium_top10.map((aluno, idx) => (
                      <tr key={aluno.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{idx + 1}º</td>
                        <td style={{ padding: '10px' }}>{aluno.nome}</td>
                        <td style={{ padding: '10px', color: 'var(--neon-green)' }}>{aluno.media}</td>
                        <td style={{ padding: '10px' }}>
                          <button className="nav-btn" style={{ fontSize: '10px', padding: '2px 6px', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }} onClick={() => setAlunoSelecionado(aluno)}>
                            Análise Pentagonal 📊
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: LISTA DE RECUPERAÇÃO */}
          {activeTab === 'recuperacao' && (
            <section className="panel" style={{ borderColor: 'var(--neon-pink)' }}>
              <div className="panel-header">
                <h2 style={{ color: 'var(--neon-pink)' }}>Plano de Intervenção Pedagógica (Abaixo de 6.0)</h2>
              </div>
              <div className="panel-body" style={{ marginTop: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--neon-pink)', textAlign: 'left', color: 'var(--neon-pink)' }}>
                      <th style={{ padding: '10px' }}>Estudante</th>
                      <th style={{ padding: '10px' }}>Média Atual</th>
                      <th style={{ padding: '10px' }}>Faltas</th>
                      <th style={{ padding: '10px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.recuperacao_lista.map((aluno) => (
                      <tr key={aluno.id} style={{ borderBottom: '1px solid #321' }}>
                        <td style={{ padding: '10px' }}>{aluno.nome}</td>
                        <td style={{ padding: '10px', color: 'var(--neon-pink)', fontWeight: 'bold' }}>{aluno.media}</td>
                        <td style={{ padding: '10px' }}>{aluno.faltas}f</td>
                        <td style={{ padding: '10px' }}>
                          <button className="nav-btn" style={{ fontSize: '10px', padding: '2px 6px', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }} onClick={() => setAlunoSelecionado(aluno)}>
                            Diagnóstico 📊
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </main>

        <footer className="cyber-footer" style={{ marginTop: '25px' }}>
          <p className="terminal-output">Módulo de Visão Multidisciplinar Ativo | Terminal Pronto.</p>
        </footer>
      </div>
    </>
  );
}