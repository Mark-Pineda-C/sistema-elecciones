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
import { PlusCircle } from "lucide-react";
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
import toast from "react-hot-toast";
import { Checkbox } from "./ui/checkbox";

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
      const data = {
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

      await create(data);
    },
    onError: (error) => {
      console.log(error);
      toast.error("Error al crear la elección");
      setFormData({
        startDate: undefined,
        endDate: undefined,
        hasBlankVote: false,
      });
    },

    onSuccess: (data) => {
      setOpen(false);
      console.log(data);
      setFormData({
        startDate: undefined,
        endDate: undefined,
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
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(formData.startDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Finalización</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(formData.endDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData({ ...formData, endDate: date })}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
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
