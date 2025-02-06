"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Vote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { MainHeader } from "@/components/main-header";
import Link from "next/link";
import { CreateElection } from "@/components/create-election";

export default function Home() {
  const { data: elections, isLoading, isSuccess } = useQuery(convexQuery(api.elections.list, {}));

  if (isLoading) {
    return (
      <div className="p-6">
        <MainHeader />
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-gray-500">Cargando elecciones...</p>
        </div>
      </div>
    );
  }

  if (isSuccess && (!elections || elections.length === 0)) {
    return (
      <div className="p-6">
        <MainHeader />
        <div className="flex flex-col justify-center items-center min-h-[200px] gap-4">
          <p className="text-gray-500">No hay elecciones creadas</p>
          <CreateElection title="Crear Primera Elección" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <MainHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {elections?.map((election) => (
          <Card key={election._id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Vote className="mr-2 h-5 w-5" />
                {election.name}
              </CardTitle>
              <CardDescription>
                {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    election.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {election.isActive ? "Activa" : "Inactiva"}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/eleccion/${election._id}`}>Ver detalles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
