"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ExampleSimpleModalPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Ejemplo: Modal Simple con Botón
        </h1>
        <p className="text-gray-600">
          Este es un ejemplo de un modal simple que se abre con un botón
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modal Simple</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Abrir Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modal de Ejemplo</DialogTitle>
                <DialogDescription>
                  Este es un modal simple que se puede cerrar haciendo clic en
                  el botón X o presionando la tecla Escape.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600">
                  Contenido del modal aquí. Puedes agregar cualquier contenido
                  que necesites.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características del Modal</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sidebar rounded-full"></span>
              Se abre con un botón
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sidebar rounded-full"></span>
              Se puede cerrar con el botón X
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sidebar rounded-full"></span>
              Se puede cerrar con la tecla Escape
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sidebar rounded-full"></span>
              Se puede cerrar haciendo clic fuera del modal
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sidebar rounded-full"></span>
              Diseño responsivo y accesible
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
