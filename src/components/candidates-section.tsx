"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, MoreVertical, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

interface CandidatesSectionProps {
  candidates: Doc<"candidate">[];
  election: Doc<"election">;
}

export function CandidatesSection({ candidates, election }: CandidatesSectionProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Doc<"candidate"> | null>(null);
  const deleteCandidate = useConvexMutation(api.candidates.deleteCandidate);

  const { mutate, isPending } = useMutation({
    mutationKey: ["deleteCandidate"],
    mutationFn: async (candidateId: Id<"candidate">) => {
      await deleteCandidate({ candidateId });
    },
    onError: (error) => {
      console.error("Error al eliminar candidato", error);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddCandidateForm electionId={election._id} isElectionActive={election.isActive} />
      </div>

      <UpdateCandidateForm
        candidate={selectedCandidate || ({} as Doc<"candidate">)}
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        isElectionActive={election.isActive}
      />

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-gray-500">No hay candidatos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <Card key={candidate._id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center w-full justify-between">
                  <div className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    {candidate.name}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-32 bg-background shadow-md rounded-sm border overflow-hidden p-1 gap-1"
                    >
                      <DropdownMenuItem
                        disabled={election.isActive}
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setIsEditOpen(true);
                        }}
                        className="font-normal px-2 py-1.5 flex items-center gap-2 hover:bg-zinc-500/10 duration-200 rounded-sm cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 font-normal px-2 py-1.5 flex items-center gap-2 hover:bg-zinc-500/10 duration-200 rounded-sm cursor-pointer"
                        onClick={() => mutate(candidate._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>

                <CardDescription>{candidate.votes} votos</CardDescription>
              </CardHeader>
            </Card>
          ))}
          {election.hasBlankVote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Voto en Blanco
                </CardTitle>
                <CardDescription>0 votos</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function AddCandidateForm({ electionId, isElectionActive }: { electionId: Id<"election">; isElectionActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const create = useConvexMutation(api.candidates.create);

  const { mutate, isPending } = useMutation({
    mutationKey: ["addCandidate"],
    mutationFn: async (formData: FormData) => {
      const data = {
        name: formData.get("name") as string,
        electionId: formData.get("electionId") as Id<"election">,
      };

      if (!data.name) {
        throw new Error("El nombre del candidato es requeridos");
      }
      await create(data);
    },
    onError: (error) => {
      console.error("Error al agregar candidato", error);
      toast.error(error.message);
    },
    onSuccess: () => {
      setIsOpen(false);
    },
  });
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={isElectionActive}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Candidato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Candidato</DialogTitle>
        </DialogHeader>
        <form action={mutate} className="space-y-4">
          <input type="hidden" name="electionId" value={electionId} />
          <div>
            <Label htmlFor="name">Nombre del Candidato</Label>
            <Input id="name" name="name" placeholder="Ingrese el nombre del candidato" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Agregando..." : "Agregar Candidato"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateCandidateForm({
  candidate,
  isEditOpen,
  setIsEditOpen,
  isElectionActive,
}: {
  candidate: Doc<"candidate">;
  isEditOpen: boolean;
  setIsEditOpen: (isEditOpen: boolean) => void;
  isElectionActive: boolean;
}) {
  const update = useConvexMutation(api.candidates.update);

  const { mutate, isPending } = useMutation({
    mutationKey: ["updateCandidate"],
    mutationFn: async (formData: FormData) => {
      const data = {
        name: formData.get("name") as string,
        candidateId: formData.get("candidateId") as Id<"candidate">,
      };

      if (!data.name) {
        throw new Error("El nombre del candidato es requeridos");
      }
      await update(data);
    },
    onError: (error) => {
      console.error("Error al actualizar candidato", error);
    },
    onSuccess: () => {
      setIsEditOpen(false);
    },
  });

  return (
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Candidato</DialogTitle>
        </DialogHeader>
        <form action={mutate} className="space-y-4">
          <input type="hidden" name="candidateId" value={candidate._id} />
          <div>
            <Label htmlFor="editName">Nombre del Candidato</Label>
            <Input
              id="editName"
              name="name"
              placeholder="Ingrese el nombre del candidato"
              defaultValue={candidate.name}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
