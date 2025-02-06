import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Edit2, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { Checkbox } from "./ui/checkbox";
import { DateTimePicker } from "./ui/date-time";

interface EditElectionProps {
  election: {
    _id: Id<"election">;
    name: string;
    startDate: number;
    endDate: number;
    hasBlankVote: boolean;
  };
}

export function EditElection({ election }: EditElectionProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date(election.startDate),
    endDate: new Date(election.endDate),
    hasBlankVote: election.hasBlankVote,
  });

  const update = useConvexMutation(api.elections.update);

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-election"],
    mutationFn: async (formData: FormData) => {
      const data = {
        id: election._id,
        name: formData.get("name") as string,
        startDate: Number.parseInt(formData.get("startDate") as string),
        endDate: Number.parseInt(formData.get("endDate") as string),
        hasBlankVote: formData.get("hasBlankVote") === "true",
      };

      if (!data.name) {
        throw new Error("El nombre no puede estar vacio");
      }

      if (!data.startDate || !data.endDate) {
        throw new Error("Fechas inválidas");
      }

      return await update(data);
    },
    onError: (error) => {
      console.log(error);
      toast.error("Error al actualizar la elección");
      setFormData({
        startDate: new Date(election.startDate),
        endDate: new Date(election.endDate),
        hasBlankVote: election.hasBlankVote,
      });
    },
    onSuccess: (data) => {
      setOpen(false);
      toast.success("Elección actualizada correctamente");
      if (!data) return;
      setFormData({
        startDate: new Date(data?.startDate),
        endDate: new Date(data?.endDate),
        hasBlankVote: data?.hasBlankVote,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <Button variant="outline" size="sm" className="max-md:hidden">
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Elección
          </Button>
          <Button variant="outline" size="icon" className="md:hidden">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[475px]">
        <form action={mutate} className="gap-4 flex flex-col">
          <input type="hidden" name="startDate" defaultValue={formData.startDate?.getTime()} />
          <input type="hidden" name="endDate" defaultValue={formData.endDate?.getTime()} />
          <input type="hidden" name="hasBlankVote" defaultValue={formData.hasBlankVote.toString()} />
          <DialogDescription>Editar</DialogDescription>
          <DialogHeader>
            <DialogTitle>Editar Elección</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Elección</Label>
              <Input id="name" placeholder="Nombre de la Elección" name="name" defaultValue={election.name} />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora de inicio</Label>
              <DateTimePicker
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date! })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora de finalización</Label>
              <DateTimePicker
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date! })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasBlankVote"
                checked={formData.hasBlankVote}
                onCheckedChange={(checked) => setFormData({ ...formData, hasBlankVote: checked as boolean })}
              />
              <Label htmlFor="hasBlankVote">Permitir voto en blanco</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="reset"
              onClick={() => {
                setOpen(false);
                setFormData({
                  startDate: new Date(election.startDate),
                  endDate: new Date(election.endDate),
                  hasBlankVote: election.hasBlankVote,
                });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Actualizando..." : "Actualizar Elección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
