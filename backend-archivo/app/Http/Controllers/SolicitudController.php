<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use Illuminate\Http\Request;

class SolicitudController extends Controller
{
    public function index()
    {
        return response()->json(
            Solicitud::query()->orderByDesc('id')->get(),
            200
        );
    }

    public function store(Request $request)
    {
        $camposValidados = $request->validate([
            'dni' => 'required|string|max:8',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'telefono' => 'nullable|string|max:9',
            'direccion' => 'nullable|string',
            'expediente_solicitado' => 'required|string',
            'descripcion' => 'required|string',
            'fecha_solicitud' => 'required|date',
        ]);

        $camposValidados['estado'] = 'Pendiente';

        $solicitud = Solicitud::create($camposValidados);

        return response()->json($solicitud, 201);
    }

    public function update(Request $request, int $solicitude)
    {
        $solicitud = Solicitud::findOrFail($solicitude);

        $camposValidados = $request->validate([
            'estado' => 'required|in:Pendiente,Aceptada,Rechazada',
            'motivo_rechazo' => 'nullable|string',
            'costo_tupa' => 'nullable|numeric',
            'tipo_formato_tupa' => 'nullable|string',
            'paginas_simples' => 'nullable|string',
            'paginas_fedateadas' => 'nullable|string',
            'numero_hojas' => 'nullable|integer',
            'cantidad_copias' => 'nullable|integer',
        ]);

        $solicitud->update($camposValidados);

        return response()->json($solicitud, 200);
    }

    public function show(int $solicitude)
    {
        return response()->json(
            Solicitud::findOrFail($solicitude),
            200
        );
    }

    public function destroy(int $solicitude)
    {
        Solicitud::findOrFail($solicitude)->delete();

        return response()->json([
            'message' => 'Eliminado'
        ], 200);
    }

    public function ingresosCaja()
    {
        $registros = Solicitud::whereIn('estado', ['Aceptada', 'Rechazada'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($registros, 200);
    }
}