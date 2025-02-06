"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";

export default function VotoVerification() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Dividir el ID en electionId y voterId
  const [electionId, voterId] = id.split("%26") as [Id<"election">, Id<"voter">];

  const { data, isLoading } = useQuery(
    convexQuery(api.voters.getVoterDetails, {
      electionId,
      voterId,
    }),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-gray-500">Verificando información del votante...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.voter || !data.election) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No se encontró la información del votante o la elección no existe.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { voter, election } = data;

  if (voter.hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                {election.name}
              </CardTitle>
              <CardDescription>
                {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Voto ya registrado</AlertTitle>
                <AlertDescription>
                  Usted ya ha emitido su voto en esta elección el día{" "}
                  {voter.votedAt ? new Date(voter.votedAt).toLocaleString() : "N/A"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const now = Date.now();
  if (!election.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                {election.name}
              </CardTitle>
              <CardDescription>
                {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Elección no activa</AlertTitle>
                <AlertDescription>
                  Esta elección no se encuentra activa en este momento. Por favor, contacte al administrador.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (now < election.startDate) {
    const timeToStart = new Date(election.startDate).getTime() - now;
    const daysToStart = Math.floor(timeToStart / (1000 * 60 * 60 * 24));
    const hoursToStart = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                {election.name}
              </CardTitle>
              <CardDescription>
                {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Votación aún no iniciada</AlertTitle>
                <AlertDescription>
                  La votación comenzará en {daysToStart > 0 ? `${daysToStart} días y` : ""}{" "}
                  {hoursToStart > 0 ? `${hoursToStart} horas.` : "menos de una hora."} Fecha de inicio:{" "}
                  {new Date(election.startDate).toLocaleString()}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (now > election.endDate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                {election.name}
              </CardTitle>
              <CardDescription>
                {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Votación finalizada</AlertTitle>
                <AlertDescription>
                  La votación finalizó el {new Date(election.endDate).toLocaleString()}. Ya no es posible emitir votos
                  en esta elección.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              {election.name}
            </CardTitle>
            <CardDescription>
              {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Información del Votante</h3>
              <p className="text-sm text-gray-500">{voter.name}</p>
              <p className="text-sm text-gray-500">{voter.email}</p>
            </div>
            <Button asChild>
              <Link href={`/voto/${id}/votar`}>Proceder a Votar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
