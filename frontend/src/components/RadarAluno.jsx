import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import axios from 'axios';

// Recebe o alunoId e a apiUrl de produção vinda do componente pai
export function RadarAluno({ alunoId, apiUrl }) {
  const [dadosRadar, setDadosRadar] = useState([]);

  useEffect(() => {
    if (alunoId && apiUrl) {
      axios.get(`${apiUrl}/api/analytics/aluno/${alunoId}/radar/`)
        .then(response => {
          console.log("Dados recebidos do banco para o Radar:", response.data);
          setDadosRadar(response.data);
        })
        .catch(error => console.error("Erro ao buscar dados do radar:", error));
    }
  }, [alunoId, apiUrl]);

  // Estilo Glassmorphism unificado com o restante do App.jsx
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '1rem',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box'
  };

  if (dadosRadar.length === 0) {
    return (
      <div style={{ ...glassStyle, color: '#94a3b8', textAlign: 'center', padding: '3rem 1.5rem' }}>
        Nenhuma nota técnica encontrada para este aluno no banco.
      </div>
    );
  }

  return (
    <div style={glassStyle}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#22d3ee', margin: '0 0 0.25rem 0', textAlign: 'center' }}>
        Análise de Competências Técnicas
      </h3>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
        Comparativo com a linha de corte (6.0)
      </p>
      
      {/* Gráfico Recharts com dimensões estáticas controladas */}
      <RadarChart cx={180} cy={140} outerRadius={90} width={360} height={300} data={dadosRadar}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 'bold' }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        
        {/* Camada da nota real obtida pelo aluno */}
        <Radar
          name="Nota Real"
          dataKey="A"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.25}
        />
        {/* Camada pontilhada da linha de corte pedagógica */}
        <Radar
          name="Corte (6.0)"
          dataKey="B"
          stroke="#f43f5e"
          fill="none"
          strokeDasharray="4 4"
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#fff' }} />
      </RadarChart>
    </div>
  );
}