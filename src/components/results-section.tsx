"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Doc } from "../../convex/_generated/dataModel";

// Colores para los gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface ResultsSectionProps {
  election: Doc<"election">;
  candidates: Doc<"candidate">[];
  voters: Doc<"voter">[];
}

export function ResultsSection({ election, candidates, voters }: ResultsSectionProps) {
  const now = Date.now();
  const totalVotes = voters.filter((voter) => voter.hasVoted).length;

  // Si la elección aún no comienza
  if (now < election.startDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados no disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">La elección aún no ha comenzado.</p>
        </CardContent>
      </Card>
    );
  }

  // Si no hay votos aún
  if (totalVotes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin votos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Aún no se han registrado votos en esta elección.</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para los resultados
  const votesData = candidates.map((candidate, index) => ({
    name: candidate.name,
    votes: candidate.votes,
    fill: COLORS[index % COLORS.length],
    percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
  }));

  if (election.hasBlankVote) {
    const blankVotes = voters.filter((voter) => voter.hasVoted && !voter.votedFor).length;
    votesData.push({
      name: "En Blanco",
      votes: blankVotes,
      fill: COLORS[votesData.length % COLORS.length],
      percentage: totalVotes > 0 ? (blankVotes / totalVotes) * 100 : 0,
    });
  }

  // Para 3 o menos opciones, mostrar barras horizontales
  if (candidates.length <= 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados de la votación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {votesData.map((data) => (
              <div key={data.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{data.name}</span>
                  <span className="text-gray-500">
                    {data.votes} votos ({data.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.percentage}%`,
                      backgroundColor: data.fill,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-4 text-sm text-gray-500">Total de votos: {totalVotes}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Para más de 3 candidatos, mostrar gráfico de dona
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de votos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={votesData}
                dataKey="votes"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {votesData.map((entry, index) => (
                  <Cell
                    key={`cell-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      index
                    }`}
                    fill={entry.fill}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} votos`, "Votos"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">Total de votos: {totalVotes}</p>
        </div>
      </CardContent>
    </Card>
  );
}
