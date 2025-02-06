"use client";

import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { DialogHeader, DialogFooter } from "./ui/dialog";
import { useMutation } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";

export function DeleteElectionDialog({ electionId }: { electionId: Id<"election"> }) {
  const router = useRouter();
  const [open, onOpen] = useState(false);
  const deleteElection = useMutation(api.elections.deleteElection);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Eliminar Elección
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿Estás seguro de eliminar esta elección?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con esta elección.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              deleteElection({ electionId });
              router.push("/");
            }}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
