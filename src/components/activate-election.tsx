"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlayCircle } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "react-hot-toast";

export function ActivateElectionDialog({ electionId }: { electionId: Id<"election"> }) {
  const [open, setOpen] = useState(false);
  const activateElection = useMutation(api.elections.activateElection);

  const handleActivate = async () => {
    try {
      await activateElection({ electionId });
      setOpen(false);
      toast.success("Elección activada correctamente");
    } catch (error) {
      console.error("Error al activar la elección:", error);
      toast.error("Error al activar la elección");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setOpen(true)}>
        <PlayCircle className="w-4 h-4" />
        Activar Elección
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activar Elección</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              ¿Estás seguro que deseas activar esta elección? Una vez activada, no podrás:
              <ul className="list-disc list-inside mt-2">
                <li>Editar la información de la elección</li>
                <li>Eliminar la elección</li>
                <li>Agregar o eliminar candidatos</li>
                <li>Eliminar votantes</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleActivate}>Activar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
