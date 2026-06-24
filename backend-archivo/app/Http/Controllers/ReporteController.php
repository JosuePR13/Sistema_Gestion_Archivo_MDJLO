<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expediente;

class ReporteController extends Controller
{
    public function stats()
    {
        $totalExpedientes = Expediente::count();
        $expedientesDigitalizados = Expediente::where('digitalizado', true)->count();
        $expedientesPendientes = $totalExpedientes - $expedientesDigitalizados;
        $porcentajeDigitalizacion = $totalExpedientes > 0
            ? round(($expedientesDigitalizados / $totalExpedientes) * 100, 2)
            : 0;

        return response()->json([
            'total_expedientes' => $totalExpedientes,
            'expedientes_digitalizados' => $expedientesDigitalizados,
            'expedientes_pendientes' => $expedientesPendientes,
            'porcentaje_digitalizacion' => $porcentajeDigitalizacion,
        ], 200);
    }

    public function porArea()
    {
        $areas = Expediente::with(['areaActual'])
            ->get()
            ->groupBy('areaActual.nombre')
            ->map(function ($expedientes, $nombreArea) {
                return [
                    'nombre' => $nombreArea,
                    'cantidad' => $expedientes->count(),
                ];
            })
            ->values();

        return response()->json([
            'areas' => $areas,
        ], 200);
    }

    public function digitalizacion(Request $request)
    {
        $query = Expediente::query();

        if ($request->area_id) {
            $query->where('area_actual_id', $request->area_id);
        }

        if ($request->fecha_inicio && $request->fecha_fin) {
            $query->whereBetween('fecha_ingreso', [
                $request->fecha_inicio,
                $request->fecha_fin
            ]);
        }

        $total = $query->count();
        $digitalizados = $query->clone()->where('digitalizado', true)->count();
        $noDigitalizados = $total - $digitalizados;
        $porcentaje = $total > 0
            ? round(($digitalizados / $total) * 100, 2)
            : 0;

        return response()->json([
            'total' => $total,
            'digitalizados' => $digitalizados,
            'no_digitalizados' => $noDigitalizados,
            'porcentaje' => $porcentaje,
        ], 200);
    }

    public function porFecha(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $expedientes = Expediente::with(['tipoDocumento', 'areaActual'])
            ->whereBetween('fecha_ingreso', [
                $request->fecha_inicio,
                $request->fecha_fin
            ])
            ->orderBy('fecha_ingreso', 'desc')
            ->get();

        if ($expedientes->isEmpty()) {
            return response()->json([
                'message' => 'No hay expedientes en el período seleccionado',
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin' => $request->fecha_fin,
                'total_expedientes' => 0,
                'expedientes' => [],
            ], 200);
        }

        return response()->json([
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
            'total_expedientes' => $expedientes->count(),
            'expedientes' => $expedientes,
        ], 200);
    }
}
