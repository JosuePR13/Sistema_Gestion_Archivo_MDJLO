<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Area;

class AreaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:areas,nombre',
            'descripcion' => 'required|string|max:255',
        ]);

        $area = Area::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'activo' => 1,
        ]);

        return response()->json([
            'message' => 'Área registrada correctamente',
            'area' => $area,
        ], 201);
    }

    public function index()
    {
        $areas = Area::orderBy('nombre')->get();

        if ($areas->isEmpty()) {
            return response()->json([
                'message' => 'No hay áreas registradas',
                'areas' => [],
            ], 200);
        }

        return response()->json($areas, 200);
    }

    public function show($id)
    {
        $area = Area::find($id);

        if (!$area) {
            return response()->json([
                'message' => 'Área no encontrada'
            ], 404);
        }

        return response()->json($area, 200);
    }

    public function update(Request $request, $id)
    {
        $area = Area::find($id);

        if (!$area) {
            return response()->json([
                'message' => 'Área no encontrada'
            ], 404);
        }

        $request->validate([
            'nombre' => 'required|string|max:100|unique:areas,nombre,' . $id,
            'descripcion' => 'required|string|max:255',
        ]);

        $area->update([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
        ]);

        return response()->json([
            'message' => 'Área actualizada correctamente',
            'area' => $area,
        ], 200);
    }

    public function destroy($id)
    {
        $area = Area::find($id);

        if (!$area) {
            return response()->json([
                'message' => 'Área no encontrada'
            ], 404);
        }


        $tieneExpedientes = $area->expedientesOrigen()->count() > 0 ||
            $area->expedientesActual()->count() > 0;

        if ($tieneExpedientes) {
            return response()->json([
                'message' => 'No se puede desactivar el área porque tiene expedientes asociados'
            ], 422);
        }

        $area->update(['activo' => 0]);

        return response()->json([
            'message' => 'Área desactivada correctamente'
        ], 200);
    }
}