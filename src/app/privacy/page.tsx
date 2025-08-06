import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y protección de datos",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Información que Recopilamos
          </h2>
          <p className="text-gray-600 mb-4">
            Recopilamos información personal necesaria para el funcionamiento de
            la aplicación, incluyendo datos de usuarios y pacientes para la
            gestión de procesos farmacéuticos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Uso de la Información
          </h2>
          <p className="text-gray-600 mb-4">
            La información recopilada se utiliza exclusivamente para:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4 ml-4">
            <li>Gestión de usuarios y autenticación</li>
            <li>Procesos farmacéuticos y médicos</li>
            <li>Mejora de la aplicación</li>
            <li>Cumplimiento de regulaciones aplicables</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Protección de Datos
          </h2>
          <p className="text-gray-600 mb-4">
            Implementamos medidas de seguridad técnicas y organizativas para
            proteger la información personal contra acceso no autorizado,
            alteración, divulgación o destrucción.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. Compartir Información
          </h2>
          <p className="text-gray-600 mb-4">
            No vendemos, alquilamos o compartimos información personal con
            terceros, excepto cuando sea necesario para el funcionamiento de la
            aplicación o cuando lo requiera la ley.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            5. Derechos del Usuario
          </h2>
          <p className="text-gray-600 mb-4">Los usuarios tienen derecho a:</p>
          <ul className="list-disc list-inside text-gray-600 mb-4 ml-4">
            <li>Acceder a su información personal</li>
            <li>Corregir datos inexactos</li>
            <li>Solicitar la eliminación de datos</li>
            <li>Oponerse al procesamiento de datos</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Retención de Datos</h2>
          <p className="text-gray-600 mb-4">
            Conservamos la información personal solo durante el tiempo necesario
            para cumplir con los propósitos para los que fue recopilada o según
            lo requieran las regulaciones aplicables.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            7. Cookies y Tecnologías Similares
          </h2>
          <p className="text-gray-600 mb-4">
            Utilizamos cookies y tecnologías similares para mejorar la
            experiencia del usuario y el funcionamiento de la aplicación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            8. Cambios en la Política
          </h2>
          <p className="text-gray-600 mb-4">
            Nos reservamos el derecho de actualizar esta política de privacidad.
            Los cambios serán notificados a través de la aplicación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contacto</h2>
          <p className="text-gray-600 mb-4">
            Para preguntas sobre esta política de privacidad o para ejercer sus
            derechos, por favor contacte al administrador del sistema.
          </p>
        </section>

        <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
          <p>Última actualización: {new Date().toLocaleDateString("es-ES")}</p>
        </div>
      </div>
    </div>
  );
}
