import { useAuthActions } from "@convex-dev/auth/react";
import { PlusCircle, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { CreateElection } from "./create-election";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function MainHeader({ withOutNewButton }: { withOutNewButton?: boolean }) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <div className="flex justify-between items-center mb-6">
      <Link href="/" className="text-3xl font-bold">
        Panel de Elecciones
      </Link>
      <div className="flex gap-2">
        {!withOutNewButton && <CreateElection title="Nueva Elección" fromHeader />}
        <Button variant="outline" onClick={async () => await signOut()} className="max-md:hidden">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
        <Button
          size="icon"
          onClick={async () => await signOut().then(() => router.replace("/login"))}
          className="md:hidden"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
