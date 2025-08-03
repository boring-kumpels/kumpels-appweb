-- AlterTable
ALTER TABLE "manual_return_supplies" ADD COLUMN     "medicationId" TEXT;

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "codigo_padre" TEXT,
    "codigo_servinte" TEXT,
    "descripcion_antigua" TEXT,
    "codigo_nuevo_estandar" TEXT,
    "nueva_estructura_estandar_semantico" TEXT,
    "caracteres" TEXT,
    "clasificacion_articulo" TEXT,
    "mce" TEXT,
    "psicotropico" TEXT,
    "marcacion_regulado" TEXT,
    "vesicantes_irritantes" TEXT,
    "registro_invima" TEXT,
    "expediente" TEXT,
    "consecutivo" TEXT,
    "cum_sin_ceros" TEXT,
    "cum_con_ceros" TEXT,
    "cum_sin_ceros_formulado" TEXT,
    "pbs" TEXT,
    "ven" TEXT,
    "atc" TEXT,
    "codigo_udm" TEXT,
    "descripcion_udm" TEXT,
    "condicion_almacenamiento" TEXT,
    "mipres_dci" TEXT,
    "alto_riesgo" TEXT,
    "lasa" TEXT,
    "gabinete" TEXT,
    "nivel1_estandar_semantico" TEXT,
    "validacion_cum" TEXT,
    "inventario_24052024" TEXT,
    "observacion_reunion_compras_20240524" TEXT,
    "validacion_cum_adjudicacion" TEXT,
    "principio_activo" TEXT,
    "nombre_atc" TEXT,
    "nombre_preciso" TEXT,
    "concentracion_estandarizada" TEXT,
    "forma_farmaceutica" TEXT,
    "marca_comercial" TEXT,
    "titular_registro" TEXT,
    "importador" TEXT,
    "fabricante" TEXT,
    "via_administracion" TEXT,
    "descripcion_cum" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medications_codigo_servinte_idx" ON "medications"("codigo_servinte");

-- CreateIndex
CREATE INDEX "medications_codigo_nuevo_estandar_idx" ON "medications"("codigo_nuevo_estandar");

-- CreateIndex
CREATE INDEX "medications_cum_sin_ceros_idx" ON "medications"("cum_sin_ceros");

-- CreateIndex
CREATE INDEX "medications_cum_con_ceros_idx" ON "medications"("cum_con_ceros");

-- CreateIndex
CREATE INDEX "medications_principio_activo_idx" ON "medications"("principio_activo");

-- CreateIndex
CREATE INDEX "medications_nombre_preciso_idx" ON "medications"("nombre_preciso");

-- CreateIndex
CREATE INDEX "medications_active_idx" ON "medications"("active");

-- CreateIndex
CREATE INDEX "manual_return_supplies_medicationId_idx" ON "manual_return_supplies"("medicationId");

-- AddForeignKey
ALTER TABLE "manual_return_supplies" ADD CONSTRAINT "manual_return_supplies_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
