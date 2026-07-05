<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExpedienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $ultimoArchivo = DB::table('archivos_digitales')
            ->where('expediente_id', $this->id)
            ->orderBy('uploaded_at', 'desc')
            ->first();

        return [
            'id' => $this->id,
            'numero_expediente' => $this->numero_expediente,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'tipo_documento_id' => $this->tipo_documento_id,
            'tipo_documento' => $this->tipoDocumento ? $this->tipoDocumento->nombre : 'GENERAL / ADMINISTRATIVO',
            'area_origen_id' => $this->area_origen_id,
            'area_origen' => $this->areaOrigen ? $this->areaOrigen->nombre : 'ÁREA MUNICIPAL JLO',
            'area_actual_id' => $this->area_actual_id,
            'area_actual' => $this->areaActual ? $this->areaActual->nombre : 'ARCHIVO CENTRAL',
            'numero_folios' => $this->numero_folios,
            'estado' => $this->estado,
            'fecha_ingreso' => $this->fecha_ingreso ? Carbon::parse($this->fecha_ingreso)->format('Y-m-d') : null,
            'tiempo_conservacion' => $this->tiempo_conservacion,
            'fecha_revision' => $this->fecha_revision ? Carbon::parse($this->fecha_revision)->format('Y-m-d') : 'PERMANENTE',
            'digitalizado' => (int) $this->digitalizado,
            'razon_social' => $this->razon_social,
            'monto' => $this->monto !== null ? (float) $this->monto : null,
            'registro_siaf' => $this->registro_siaf,
            'created_at' => Carbon::parse($this->created_at)->timezone('America/Lima')->toIso8601String(),
            'updated_at' => Carbon::parse($this->updated_at)->timezone('America/Lima')->toIso8601String(),
            'ultimo_pdf_at' => $ultimoArchivo ? Carbon::parse($ultimoArchivo->uploaded_at)->timezone('America/Lima')->toIso8601String() : null,
        ];
    }
}