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
import { PlusCircle, CalendarIcon, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import toast from "react-hot-toast";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectItem, SelectContent } from "./ui/select";
import { DateTimePicker } from "./ui/date-time";

export function CreateElection({ title, fromHeader }: { title: string; fromHeader?: boolean }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    hasBlankVote: false,
  });

  const create = useConvexMutation(api.elections.create);

  const { mutate, isPending } = useMutation({
    mutationKey: ["create-election"],
    mutationFn: async (formData: FormData) => {
      const startDate = new Date(Number.parseInt(formData.get("startDate") as string));
      const endDate = new Date(Number.parseInt(formData.get("endDate") as string));

      startDate.setHours(startDate.getHours(), startDate.getMinutes());
      endDate.setHours(endDate.getHours(), endDate.getMinutes());

      const data = {
        name: formData.get("name") as string,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        hasBlankVote: formData.get("hasBlankVote") === "true",
      };

      if (!data.name) {
        throw new Error("El nombre no puede estar vacio");
      }

      if (!data.startDate || !data.endDate) {
        throw new Error("Fechas inválidas");
      }

      await create(data);
    },
    onError: (error) => {
      console.log(error);
      toast.error("Error al crear la elección");
      setFormData({
        endDate: undefined,
        startDate: undefined,
        hasBlankVote: false,
      });
    },

    onSuccess: (data) => {
      setOpen(false);
      console.log(data);
      setFormData({
        endDate: undefined,
        startDate: undefined,
        hasBlankVote: false,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {fromHeader ? (
          <div>
            <Button className="max-md:hidden">
              <PlusCircle className="mr-2 h-4 w-4" />
              {title}
            </Button>
            <Button size="icon" className="md:hidden">
              <PlusCircle className=" h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {title}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form action={mutate} className="gap-4 flex flex-col">
          <input type="hidden" name="startDate" defaultValue={formData.startDate?.getTime()} />
          <input type="hidden" name="endDate" defaultValue={formData.endDate?.getTime()} />
          <input type="hidden" name="hasBlankVote" defaultValue={formData.hasBlankVote.toString()} />
          <DialogDescription>Crear</DialogDescription>
          <DialogHeader>
            <DialogTitle>Nueva Elección</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Elección</Label>
              <Input id="name" placeholder="Nombre de la Elección" name="name" />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora de inicio</Label>
              <DateTimePicker
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora de finalización</Label>
              <DateTimePicker
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
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
                  endDate: undefined,
                  startDate: undefined,
                  hasBlankVote: false,
                });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear Elección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
