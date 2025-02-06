"use client";
import { useState, useRef, useDeferredValue } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Loader2, Link } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type RowSelectionState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useMutation } from "@tanstack/react-query";

import { useMutation as useConvexMutation } from "convex/react";
import { useConvexMutation as useTanstackConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import Papa from "papaparse";

interface VotersSectionProps {
  voters: Doc<"voter">[];
  candidates: Array<{
    _id: Id<"candidate">;
    name: string;
  }>;
  election: Pick<Doc<"election">, "hasBlankVote" | "isActive">;
  electionId: Id<"election">;
}

export function VotersSection({ voters, candidates, election, electionId }: VotersSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkVoters, setBulkVoters] = useState<
    {
      name: string;
      email: string;
    }[]
  >([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const bulkAddVoters = useConvexMutation(api.voters.bulkCreate);
  const bulkDeleteVoters = useConvexMutation(api.voters.bulkDelete);

  const { mutate: bulkAddVotersMutation, isPending: isBulkAddVotersPending } = useMutation({
    mutationKey: ["bulk-add-voters"],
    mutationFn: async () => {
      await bulkAddVoters({
        voters: bulkVoters,
        electionId,
      });
    },
    onSuccess: () => {
      toast.success("Votantes importados exitosamente");
      setBulkVoters([]);
      setShowBulkImport(false);
    },
  });

  const { mutate: bulkDeleteVotersMutation, isPending: isBulkDeletePending } = useMutation({
    mutationKey: ["bulk-delete-voters"],
    mutationFn: async () => {
      const selectedVoterIds = Object.keys(rowSelection).map((index) => voters[Number.parseInt(index)]._id);
      await bulkDeleteVoters({
        voterIds: selectedVoterIds,
        electionId,
      });
    },
    onSuccess: () => {
      toast.success("Votantes eliminados exitosamente");
      setRowSelection({});
    },
    onError: (error) => {
      toast.error("Error al eliminar votantes");
      console.error(error);
    },
  });

  const { mutate: generateVoterUrls, isPending: isGeneratingVoterUrls } = useMutation({
    mutationKey: ["generate-voter-urls"],
    mutationFn: useTanstackConvexMutation(api.voters.generateVoterUrls),
    onSuccess: (newVoters) => {
      toast.success("URLs de votantes generadas y enviadas exitosamente");
      toast.promise(
        async () => {
          const csvData = (newVoters as Array<{ name: string; email: string; url: string }>).map((voter) => ({
            Nombres: voter.name,
            Correo: voter.email,
            "URL Generada": voter.url,
          }));

          const csv = Papa.unparse(csvData, {
            header: true,
          });

          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);

          link.setAttribute("href", url);
          link.setAttribute("download", `votantes-${new Date().toISOString().split("T")[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
        {
          loading: "Generando CSV de votantes...",
          error: "Error al generar CSV de votantes",
          success: "CSV de votantes generado exitosamente",
        },
      );
    },
  });

  const columns: ColumnDef<(typeof voters)[0]>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "vote",
      header: "Voto",
      cell: ({ row }) => {
        const voter = row.original;
        if (!voter.hasVoted) return "-";
        return getCandidateNameById(voter.votedFor);
      },
    },
  ];

  const table = useReactTable({
    data: voters,
    columns,
    state: {
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      beforeFirstChunk: () => {
        setIsImporting(true);
      },
      complete: (results) => {
        const voters = results.data
          .slice(1)
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          .map((row: any) => ({
            name: row[0],
            email: row[1],
          }))
          .filter((voter) => voter.name && voter.email);

        setBulkVoters(voters);
        setIsImporting(false);
        setShowBulkImport(true);
      },
      header: false,
    });
  };

  const getCandidateNameById = (candidateId?: Id<"candidate">) => {
    if (!candidateId) return "En Blanco";
    const candidate = candidates.find((c) => c._id === candidateId);
    return candidate ? candidate.name : "En Blanco";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {showBulkImport ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">{bulkVoters.length} registros encontrados</p>
            <Button onClick={() => bulkAddVotersMutation()} disabled={isBulkAddVotersPending}>
              {isBulkAddVotersPending ? "Importando..." : "Confirmar Importación"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBulkVoters([]);
                setShowBulkImport(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : isImporting ? (
          <Loader2 />
        ) : (
          <>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={election.isActive}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
            </Button>
            {!election.isActive && voters.length > 0 && (
              <Button
                variant="outline"
                onClick={() => generateVoterUrls({ electionId })}
                disabled={isGeneratingVoterUrls}
              >
                <Link className="mr-2 h-4 w-4" />
                {isGeneratingVoterUrls ? "Generando..." : "Generar URLs"}
              </Button>
            )}
          </>
        )}
        {/* <AddVoterDialog electionId={electionId} /> */}
      </div>

      {voters.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar votantes..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
          </div>
          <div>
            {!election.isActive && Object.keys(rowSelection).length > 0 && (
              <Button variant="destructive" onClick={() => bulkDeleteVotersMutation()} disabled={isBulkDeletePending}>
                {isBulkDeletePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>Eliminar seleccionados ({Object.keys(rowSelection).length})</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {voters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-gray-500">No hay votantes registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AddVoterDialog({ electionId }: { electionId: Id<"election"> }) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const addSimpleVoter = useConvexMutation(api.voters.create);

  const { mutate, isPending } = useMutation({
    mutationKey: ["add-simple-voter"],
    mutationFn: async (formData: FormData) => {
      const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        electionId,
      };
      if (!data.name || !data.email) {
        toast.error("Todos los campos son requeridos");
        return;
      }

      await addSimpleVoter(data);
    },

    onSuccess: () => {
      toast.success("Votante agregado exitosamente");
      setIsAddOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Votante
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Votante</DialogTitle>
        </DialogHeader>
        <form action={mutate} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Nombre del votante" />
          </div>
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" name="email" placeholder="correo@ejemplo.com" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Agregando..." : "Agregar Votante"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
