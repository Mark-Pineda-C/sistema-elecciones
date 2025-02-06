"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, AlertCircle, Timer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function VotingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [selectedCandidate, setSelectedCandidate] = useState<Id<"candidate"> | "blank">("blank");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
  const [showWarning, setShowWarning] = useState(false);

  // Dividir el ID en electionId y voterId
  const [electionId, voterId] = id.split("%26") as [Id<"election">, Id<"voter">];

  const { data, isLoading } = useQuery(
    convexQuery(api.candidates.getCandidatesByElection, {
      electionId,
    }),
  );

  const { mutate, isPending } = useMutation({
    mutationFn: useConvexMutation(api.voters.registerVote),
    onSuccess: () => {
      router.back();
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 60 && !showWarning) {
          setShowWarning(true);
        }
        if (prev <= 0) {
          // Registrar voto en blanco automáticamente
          mutate({ voterId, candidateId: "blank" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning, mutate, voterId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-500">Cargando candidatos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Emitir Voto
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <span className={`${timeLeft <= 60 ? "text-red-500" : ""}`}>{formatTime(timeLeft)}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {showWarning && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>¡Atención!</AlertTitle>
                <AlertDescription>
                  Te queda menos de un minuto para emitir tu voto. Si no seleccionas una opción, se registrará
                  automáticamente como voto en blanco.
                </AlertDescription>
              </Alert>
            )}

            <RadioGroup
              value={selectedCandidate}
              onValueChange={(value) => setSelectedCandidate(value as Id<"candidate"> | "blank")}
              className="space-y-4"
            >
              {data?.candidates?.map((candidate) => (
                <div key={candidate._id} className="flex items-center space-x-2">
                  <RadioGroupItem value={candidate._id} id={candidate._id} />
                  <Label htmlFor={candidate._id}>{candidate.name}</Label>
                </div>
              ))}
              {data?.election?.hasBlankVote && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blank" id="blank" />
                  <Label htmlFor="blank">Voto en Blanco</Label>
                </div>
              )}
            </RadioGroup>

            <Button
              onClick={() => {
                mutate({ voterId, candidateId: selectedCandidate });
              }}
              disabled={isPending}
              className="w-full"
            >
              Registrar Voto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
