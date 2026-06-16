<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expediente;
use App\Models\ArchivoDigital;
use App\Models\HistorialEdicion;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ArchivoDigitalController extends Controller
{
    public function subir(Request $request, $id)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:pdf|max:51200',
        ]);

        $expediente = Expediente::findOrFail($id);
        $archivo = $request->file('archivo');

        $nombreLimpio = preg_replace('/[^a-zA-Z0-9._-]/', '_', $archivo->getClientOriginalName());
        $nombre_archivo = time() . '_' . $nombreLimpio;

        $ruta = $archivo->storeAs('expedientes/' . $expediente->id, $nombre_archivo, 'public');

        $archivoDigital = ArchivoDigital::create([
            'expediente_id' => $expediente->id,
            'usuario_id' => $request->user()->id,
            'nombre_original' => $archivo->getClientOriginalName(),
            'nombre_archivo' => $nombre_archivo,
            'ruta_archivo' => $ruta,
            'tipo_mime' => $archivo->getMimeType(),
            'tamano_bytes' => $archivo->getSize(),
            'uploaded_at' => now(),
        ]);

        $expediente->update(['digitalizado' => true]);

        // Registrar en historial
        HistorialEdicion::create([
            'expediente_id' => $expediente->id,
            'campo_modificado' => 'archivo_digital',
            'valor_anterior' => null,
            'valor_nuevo' => $archivo->getClientOriginalName(),
            'usuario_id' => $request->user()->id,
            'fecha_cambio' => Carbon::now('America/Lima'),
            'observaciones' => 'Archivo PDF adjuntado',
        ]);

        return response()->json([
            'message' => 'Archivo PDF adjuntado e indexado correctamente',
            'archivo' => $archivoDigital,
        ], 201);
    }

    public function listar($id)
    {
        $expediente = Expediente::findOrFail($id);

        $archivos = ArchivoDigital::with('usuario')
            ->where('expediente_id', $expediente->id)
            ->orderBy('uploaded_at', 'desc')
            ->get();

        if ($archivos->isEmpty()) {
            return response()->json([
                'message' => 'El expediente no tiene archivos asociados',
                'archivos' => [],
            ], 200);
        }

        return response()->json([
            'archivos' => $archivos,
        ], 200);
    }

    public function descargar($id, $archivo_id)
    {
        $expediente = Expediente::findOrFail($id);

        $archivo = ArchivoDigital::where('id', $archivo_id)
            ->where('expediente_id', $expediente->id)
            ->firstOrFail();

        $rutaCompleta = storage_path('app/public/' . $archivo->ruta_archivo);

        if (!file_exists($rutaCompleta)) {
            return response()->json([
                'error' => 'El archivo físico no se encuentra en el servidor'
            ], 404);
        }

        return response()->file($rutaCompleta, [
            'Content-Type' => $archivo->tipo_mime,
            'Content-Disposition' => 'attachment; filename="' . $archivo->nombre_original . '"',
        ]);
    }

    public function eliminar(Request $request, $id, $archivo_id)
    {
        $expediente = Expediente::findOrFail($id);

        $archivo = ArchivoDigital::where('id', $archivo_id)
            ->where('expediente_id', $expediente->id)
            ->firstOrFail();

        // Eliminar archivo físico
        $rutaCompleta = storage_path('app/public/' . $archivo->ruta_archivo);
        if (file_exists($rutaCompleta)) {
            unlink($rutaCompleta);
        }

        $nombreOriginal = $archivo->nombre_original;
        $archivo->delete();

        // Si no quedan más archivos, desmarcar digitalizado
        $tieneArchivos = ArchivoDigital::where('expediente_id', $expediente->id)->exists();
        if (!$tieneArchivos) {
            $expediente->update(['digitalizado' => false]);
        }

        // Registrar en historial con mensaje corregido para la UI
        HistorialEdicion::create([
            'expediente_id' => $expediente->id,
            'campo_modificado' => 'archivo_digital',
            'valor_anterior' => $nombreOriginal,
            'valor_nuevo' => 'ELIMINADO por el operador (Archivo desvinculado)',
            'usuario_id' => $request->user()->id,
            'fecha_cambio' => Carbon::now('America/Lima'),
            'observaciones' => 'Archivo PDF eliminado',
        ]);

        return response()->json([
            'message' => 'Archivo eliminado correctamente'
        ], 200);
    }
}