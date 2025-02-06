"use client";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { MainHeader } from "@/components/main-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSquare2, Award, BarChart } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { EditElection } from "@/components/edit-election";
import { CandidatesSection } from "@/components/candidates-section";
import { VotersSection } from "@/components/voters-section";
import { DeleteElectionDialog } from "@/components/delete-election";
import { ActivateElectionDialog } from "@/components/activate-election";
import { ResultsSection } from "@/components/results-section";

export default function ElectionDetail() {
  const { electionId } = useParams<{ electionId: Id<"election"> }>();

  const { data, isLoading } = useQuery(
    convexQuery(api.elections.getElectionDetails, {
      electionId,
    }),
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <MainHeader withOutNewButton />
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-gray-500">Cargando detalles de la elección...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.election) {
    return (
      <div className="p-6">
        <MainHeader withOutNewButton />
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-gray-500">Elección no encontrada</p>
        </div>
      </div>
    );
  }

  const { election, candidates, voters } = data;

  return (
    <>
      <div className="p-6">
        <MainHeader withOutNewButton />

        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold">{election.name}</h1>
            {!election.isActive && (
              <div className="flex items-center gap-2">
                <EditElection election={election} />
                <ActivateElectionDialog electionId={electionId} />
                <DeleteElectionDialog electionId={electionId} />
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span
              className={`px-2 py-1 rounded-full text-sm ${
                election.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {election.isActive ? "Activa" : "Inactiva"}
            </span>
            <span className="text-gray-500">
              {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Tabs defaultValue="candidates" className="w-full">
          <TabsList>
            <TabsTrigger value="candidates" className="flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Candidatos
            </TabsTrigger>
            <TabsTrigger value="voters" className="flex items-center">
              <UserSquare2 className="w-4 h-4 mr-2" />
              Votantes
            </TabsTrigger>
            {election.isActive && (
              <TabsTrigger value="results" className="flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                Resultados
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="candidates" className="-mt-9">
            <CandidatesSection candidates={candidates} election={election} />
          </TabsContent>

          <TabsContent value="voters" className="-mt-9">
            <VotersSection voters={voters} candidates={candidates} election={election} electionId={electionId} />
          </TabsContent>
          <TabsContent value="results" className="mt-6">
            <ResultsSection election={election} candidates={candidates} voters={voters} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
