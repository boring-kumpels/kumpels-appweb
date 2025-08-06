import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Términos y condiciones de uso de la aplicación",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Términos de Servicio</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Aceptación de los Términos
          </h2>
          <p className="text-gray-600 mb-4">
            Al acceder y utilizar esta aplicación, usted acepta estar sujeto a
            estos términos y condiciones de uso.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Uso de la Aplicación
          </h2>
          <p className="text-gray-600 mb-4">
            Esta aplicación está diseñada para la gestión de procesos
            farmacéuticos y médicos. El uso debe ser responsable y en
            cumplimiento con las regulaciones aplicables.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Privacidad y Seguridad
          </h2>
          <p className="text-gray-600 mb-4">
            Nos comprometemos a proteger la privacidad de los datos de los
            pacientes y usuarios. Toda la información se maneja de acuerdo con
            las leyes de protección de datos aplicables.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. Responsabilidades del Usuario
          </h2>
          <p className="text-gray-600 mb-4">
            Los usuarios son responsables de mantener la confidencialidad de sus
            credenciales y de reportar cualquier uso no autorizado de su cuenta.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            5. Limitaciones de Responsabilidad
          </h2>
          <p className="text-gray-600 mb-4">
            La aplicación se proporciona &quot;tal como está&quot; sin garantías
            de ningún tipo. No nos hacemos responsables por daños directos o
            indirectos derivados del uso de la aplicación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Modificaciones</h2>
          <p className="text-gray-600 mb-4">
            Nos reservamos el derecho de modificar estos términos en cualquier
            momento. Los cambios serán notificados a través de la aplicación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contacto</h2>
          <p className="text-gray-600 mb-4">
            Para preguntas sobre estos términos, por favor contacte al
            administrador del sistema.
          </p>
        </section>

        <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
          <p>Última actualización: {new Date().toLocaleDateString("es-ES")}</p>
        </div>
      </div>
    </div>
  );
}
