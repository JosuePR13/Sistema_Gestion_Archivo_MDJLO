<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expediente;
use App\Models\Area;
use App\Models\TipoDocumento;
use App\Models\HistorialEdicion;
use App\Http\Resources\ExpedienteResource;
use Carbon\Carbon;

class ExpedienteController extends Controller
{
    private function calcularEstado(?string $fechaRevision): string
    {
        if (!$fechaRevision) {
            return 'Activo';
        }

        return Carbon::today()->diffInDays(Carbon::parse($fechaRevision), false) <= 30
            ? 'Para revision'
            : 'Activo';
    }

    public function store(Request $request)
    {
        $request->validate([
            'numero_expediente' => 'required|string|max:50|unique:expedientes,numero_expediente',
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'tipo_documento_id' => 'required|exists:tipos_documento,id',
            'area_origen_id' => 'required|exists:areas,id',
            'area_actual_id' => 'required|exists:areas,id',
            'numero_folios' => 'required|integer|min:1',
            'fecha_ingreso' => 'required|date|before_or_equal:today',
            'tiempo_conservacion' => 'required|string|max:50',
        ]);

        $data = $request->all();
        $data['fecha_revision'] = null;

        $tiempo = strtolower(trim($data['tiempo_conservacion']));

        if ($tiempo !== 'permanente') {
            $fecha = Carbon::parse($data['fecha_ingreso']);

            if ($tiempo === '0.5') {
                $data['fecha_revision'] = $fecha->addMonths(6)->toDateString();
            } else {
                $años = (int) $tiempo;
                if ($años > 0) {
                    $data['fecha_revision'] = $fecha->addYears($años)->toDateString();
                }
            }
        }

        $data['estado'] = $this->calcularEstado($data['fecha_revision']);

        $expediente = Expediente::create($data);
        $expediente->load(['tipoDocumento', 'areaOrigen', 'areaActual']);

        return response()->json([
            'message' => 'Expediente registrado correctamente',
            'expediente' => new ExpedienteResource($expediente),
        ], 201);
    }

    public function index()
    {
        $expedientes = Expediente::with(['areaActual', 'tipoDocumento', 'areaOrigen'])
            ->orderBy('updated_at', 'desc')
            ->get();

        $expedientes->each(function ($exp) {
            $exp->estado = $this->calcularEstado($exp->fecha_revision);
        });
        return ExpedienteResource::collection($expedientes);
    }

    public function show($id)
    {
        $expediente = Expediente::with(['tipoDocumento', 'areaOrigen', 'areaActual'])->find($id);

        if (!$expediente) {
            return response()->json(['message' => 'Expediente no encontrado'], 404);
        }
        $expediente->estado = $this->calcularEstado($expediente->fecha_revision);

        return response()->json(new ExpedienteResource($expediente), 200);
    }

    public function update(Request $request, $id)
    {
        $expediente = Expediente::find($id);

        if (!$expediente) {
            return response()->json(['message' => 'Expediente no encontrado'], 404);
        }

        $request->validate([
            'numero_expediente' => 'required|string|max:50|unique:expedientes,numero_expediente,' . $id,
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'tipo_documento_id' => 'required|exists:tipos_documento,id',
            'area_origen_id' => 'required|exists:areas,id',
            'area_actual_id' => 'required|exists:areas,id',
            'numero_folios' => 'required|integer|min:1',
            'fecha_ingreso' => 'required|date|before_or_equal:today',
            'tiempo_conservacion' => 'required|string|max:50',
        ]);

        $data = $request->except('estado');

        $fechaIngresoAnterior = $expediente->fecha_ingreso ? Carbon::parse($expediente->fecha_ingreso)->format('Y-m-d') : null;
        $cambioFechaIngreso = $data['fecha_ingreso'] !== $fechaIngresoAnterior;
        $cambioTiempoConservacion = $data['tiempo_conservacion'] !== $expediente->tiempo_conservacion;

        if ($cambioFechaIngreso || $cambioTiempoConservacion) {
            $tiempo = strtolower(trim($data['tiempo_conservacion']));

            if ($tiempo === 'permanente') {
                $data['fecha_revision'] = null;
            } else {
                $fecha = Carbon::parse($data['fecha_ingreso']);

                if ($tiempo === '0.5') {
                    $data['fecha_revision'] = $fecha->addMonths(6)->toDateString();
                } else {
                    $años = (int) $tiempo;
                    if ($años > 0) {
                        $data['fecha_revision'] = $fecha->addYears($años)->toDateString();
                    }
                }
            }
        }

        $fechaRevisionFinal = $data['fecha_revision'] ?? ($expediente->fecha_revision ? Carbon::parse($expediente->fecha_revision)->format('Y-m-d') : null);
        $data['estado'] = $this->calcularEstado($fechaRevisionFinal);

        foreach ($data as $campo => $valor_nuevo) {
            if (in_array($campo, ['estado', 'fecha_revision'])) {
                continue;
            }

            $valor_anterior = $expediente->{$campo} ?? null;

            if ($valor_anterior instanceof Carbon) {
                $valor_anterior = $valor_anterior->format('Y-m-d');
            }

            $valor_anterior_str = (string) $valor_anterior;
            $valor_nuevo_str = (string) $valor_nuevo;

            if ($valor_anterior_str !== $valor_nuevo_str) {
                HistorialEdicion::create([
                    'expediente_id' => $expediente->id,
                    'campo_modificado' => $campo,
                    'valor_anterior' => $valor_anterior_str,
                    'valor_nuevo' => $valor_nuevo_str,
                    'usuario_id' => $request->user()->id ?? null,
                    'fecha_cambio' => Carbon::now('America/Lima'),
                ]);
            }
        }

        $expediente->update($data);
        $expediente->refresh();
        $expediente->load(['tipoDocumento', 'areaOrigen', 'areaActual']);

        return response()->json([
            'message' => 'Expediente actualizado correctamente',
            'expediente' => new ExpedienteResource($expediente),
        ], 200);
    }

    public function search(Request $request)
    {
        $query = Expediente::with(['tipoDocumento', 'areaOrigen', 'areaActual']);

        if ($request->numero_expediente) {
            $query->where('numero_expediente', 'like', '%' . $request->numero_expediente . '%');
        }
        if ($request->titulo) {
            $query->where('titulo', 'like', '%' . $request->titulo . '%');
        }
        if ($request->area_actual_id) {
            $query->where('area_actual_id', $request->area_actual_id);
        }
        if ($request->estado) {
            $query->where('estado', $request->estado);
        }
        if ($request->tipo_documento_id) {
            $query->where('tipo_documento_id', $request->tipo_documento_id);
        }
        if ($request->fecha_inicio && $request->fecha_fin) {
            $query->whereBetween('fecha_ingreso', [$request->fecha_inicio, $request->fecha_fin]);
        }

        $expedientes = $query->orderBy('updated_at', 'desc')->paginate(10);

        if ($expedientes->isEmpty()) {
            return response()->json(['message' => 'No se encontraron expedientes', 'expedientes' => []], 200);
        }

        return response()->json([
            'data' => ExpedienteResource::collection($expedientes->getCollection()),
            'current_page' => $expedientes->currentPage(),
            'last_page' => $expedientes->lastPage(),
            'per_page' => $expedientes->perPage(),
            'total' => $expedientes->total(),
        ], 200);
    }

    public function areas()
    {
        return response()->json(Area::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']), 200);
    }

    public function tiposDocumento()
    {
        return response()->json(TipoDocumento::orderBy('nombre')->get(['id', 'nombre']), 200);
    }

    public function historial($id)
    {
        $expediente = Expediente::find($id);

        if (!$expediente) {
            return response()->json(['message' => 'Expediente no encontrado'], 404);
        }

        $historialesEdiciones = HistorialEdicion::where('expediente_id', $id)
            ->with(['usuario'])
            ->orderBy('fecha_cambio', 'desc')
            ->get();

        return response()->json([
            'historialesEdiciones' => $historialesEdiciones,
        ], 200);
    }
}