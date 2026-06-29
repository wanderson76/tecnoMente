import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import axios from 'axios';

export function RadarAluno({ alunoId }) {
  const [dadosRadar, setDadosRadar] = useState([]);

  useEffect(() => {
    if (alunoId) {
      axios.get(`http://127.0.0.1:8000/api/analytics/aluno/${alunoId}/radar/`)
        .then(response => {
          console.log("Dados recebidos do banco para o Radar:", response.data);
          setDadosRadar(response.data);
        })
        .catch(error => console.error("Erro ao buscar dados do radar:", error));
    }
  }, [alunoId]);

  if (dadosRadar.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center text-gray-400 py-12">
        Nenhuma nota técnica encontrada para este aluno no banco.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg w-full flex flex-col items-center">
      <h3 className="text-lg font-semibold text-blue-400 mb-1 text-center">
        Análise de Competências Técnicas
      </h3>
      <p className="text-xs text-gray-400 text-center mb-6">Comparativo com a linha de corte (6.0)</p>
      
      {/* Forçando tamanho estático para evitar colapso de CSS do contêiner */}
      <RadarChart cx={180} cy={140} outerRadius={90} width={360} height={300} data={dadosRadar}>
        <PolarGrid stroke="#4a5568" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 'bold' }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
        
        <Radar
          name="Nota Real"
          dataKey="A"
          stroke="#60a5fa"
          fill="#3b82f6"
          fillOpacity={0.35}
        />
        <Radar
          name="Corte (6.0)"
          dataKey="B"
          stroke="#f87171"
          fill="none"
          strokeDasharray="4 4"
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
      </RadarChart>
    </div>
  );
}