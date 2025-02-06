"use client";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState("signIn");

  useEffect(() => {
    const keys: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input
      if (e.target instanceof HTMLInputElement) {
        return;
      }

      keys.push(e.key.toLowerCase());
      if (keys.length > 3) keys.shift();

      if (keys.join("") === "mlt") {
        const newFlow = flow === "signIn" ? "signUp" : "signIn";
        setFlow(newFlow);
        toast.success(`Modo cambiado a: ${newFlow}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flow]);

  const { mutate, isPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: async (formData: FormData) => {
      const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        flow: formData.get("flow") as string,
      };
      if (!data.email) {
        throw new Error("El correo electrónico es requerido");
      }
      if (!data.password) {
        throw new Error("La contraseña es requerida");
      }
      await signIn("password", formData);
      console.log("signIn completed, redirecting to /");
      router.replace("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  return (
    <div className="h-screen flex items-center justify-center">
      <form action={mutate}>
        <input type="hidden" name="flow" value={flow} />
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </label>
              <Input
                autoComplete="email"
                id="email"
                type="email"
                name="email"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                autoComplete="current-password"
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
