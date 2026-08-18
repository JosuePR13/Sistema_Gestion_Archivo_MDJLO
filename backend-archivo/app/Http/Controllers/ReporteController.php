<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expediente;
use App\Models\Solicitud;
use Dompdf\Dompdf;
use Dompdf\Options;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        $expedientes = Expediente::with(['tipoDocumento', 'areaActual', 'areaOrigen'])
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

    // =========================================================================
    // EXPORTACIÓN DE REPORTE DOCUMENTAL (EXCEL / PDF) CON FILTROS
    // =========================================================================
    public function exportarDocumental(Request $request)
    {
        $formato = $request->query('formato', 'pdf');
        $tipo    = $request->query('tipo', 'registrados');
        $anio    = $request->query('anio', 'Todos');
        $mes     = $request->query('mes', 'Todos');
        $area    = $request->query('area', 'Todas');

        $query = Expediente::with(['areaOrigen', 'tipoDocumento']);

        if ($anio !== 'Todos' && !empty($anio)) {
            $query->whereYear('fecha_ingreso', $anio);
        }

        if ($mes !== 'Todos' && !empty($mes)) {
            $query->whereMonth('fecha_ingreso', $mes);
        }

        if ($area !== 'Todas' && !empty($area)) {
            $query->whereHas('areaOrigen', function ($subQ) use ($area) {
                $subQ->where('nombre', $area);
            });
        }

        $expedientes = $query->orderBy('updated_at', 'desc')->get();

        if ($formato === 'excel') {
            return $this->exportarCsvNativo($expedientes, $tipo, $anio);
        }

        return $this->exportarPdfNativo($expedientes, $tipo, $anio, $mes, $area);
    }

    private function exportarCsvNativo($expedientes, $tipo, $anio): StreamedResponse
    {
        $fileName = "Reporte_Documental_{$tipo}_{$anio}.csv";

        return response()->streamDownload(function () use ($expedientes, $tipo) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8 para Excel

            if ($tipo === 'registrados') {
                fputcsv($handle, ['N° EXPEDIENTE', 'TITULO', 'AREA ORIGEN', 'FOLIOS', 'FECHA INGRESO'], ';');
                foreach ($expedientes as $exp) {
                    fputcsv($handle, [
                        $exp->numero_expediente ?? 'S/N',
                        $exp->titulo ?? '',
                        $exp->areaOrigen->nombre ?? 'Desconocida',
                        $exp->numero_folios ?? 0,
                        substr($exp->fecha_ingreso ?? $exp->created_at, 0, 10)
                    ], ';');
                }
            } elseif ($tipo === 'digitalizacion') {
                fputcsv($handle, ['N° EXPEDIENTE', 'TITULO', 'AREA ORIGEN', 'ESTADO DIGITAL', 'FECHA INGRESO'], ';');
                foreach ($expedientes as $exp) {
                    fputcsv($handle, [
                        $exp->numero_expediente ?? 'S/N',
                        $exp->titulo ?? '',
                        $exp->areaOrigen->nombre ?? 'Desconocida',
                        ($exp->digitalizado == 1 || $exp->digitalizado === true) ? 'Digitalizado' : 'Pendiente',
                        substr($exp->fecha_ingreso ?? $exp->created_at, 0, 10)
                    ], ';');
                }
            } elseif ($tipo === 'tipologia') {
                fputcsv($handle, ['TIPO DOCUMENTAL', 'TOTAL REGISTROS', 'DIGITALIZADOS', 'FISICOS'], ';');
                $map = [];
                foreach ($expedientes as $exp) {
                    $tipoDoc = $exp->tipoDocumento->nombre ?? 'General';
                    if (!isset($map[$tipoDoc])) {
                        $map[$tipoDoc] = ['total' => 0, 'digi' => 0];
                    }
                    $map[$tipoDoc]['total']++;
                    if ($exp->digitalizado == 1 || $exp->digitalizado === true) {
                        $map[$tipoDoc]['digi']++;
                    }
                }
                foreach ($map as $tipoNombre => $vals) {
                    fputcsv($handle, [
                        $tipoNombre,
                        $vals['total'],
                        $vals['digi'],
                        $vals['total'] - $vals['digi']
                    ], ';');
                }
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    private function exportarPdfNativo($expedientes, $tipo, $anio, $mes, $area)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        $listaTipos = [];
        if ($tipo === 'tipologia') {
            $map = [];
            foreach ($expedientes as $exp) {
                $tipoDoc = $exp->tipoDocumento->nombre ?? 'General';
                if (!isset($map[$tipoDoc])) {
                    $map[$tipoDoc] = ['tipo' => $tipoDoc, 'total' => 0, 'digi' => 0];
                }
                $map[$tipoDoc]['total']++;
                if ($exp->digitalizado == 1 || $exp->digitalizado === true) {
                    $map[$tipoDoc]['digi']++;
                }
            }
            $listaTipos = array_values($map);
        }

        $html = view('reportes.documental_pdf', [
            'expedientes' => $expedientes,
            'listaTipos'  => $listaTipos,
            'tipo'        => $tipo,
            'anio'        => $anio,
            'mes'         => $mes,
            'area'        => $area,
            'fechaGen'    => Carbon::now('America/Lima')->format('d/m/Y h:i A')
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"Reporte_{$tipo}_{$anio}.pdf\"",
        ]);
    }

    // =========================================================================
    // EXPORTACIÓN DE REPORTE DE COSTOS Y CAJA (EXCEL / PDF)
    // =========================================================================
    public function exportarCostos(Request $request)
    {
        $formato       = $request->query('formato', 'pdf');
        $demandaAnio   = $request->query('demanda_anio', '2026');
        $demandaMes    = $request->query('demanda_mes', 'Todos');
        $tendenciaAnio = $request->query('tendencia_anio', '2026');

        $solicitudes = Solicitud::whereIn('estado', ['Aceptada', 'Rechazada'])->get();
        $aprobadas   = $solicitudes->where('estado', 'Aceptada');
        $rechazadas  = $solicitudes->where('estado', 'Rechazada');

        $hoy      = Carbon::now('America/Lima')->format('Y-m-d');
        $fechaGen = Carbon::now('America/Lima')->format('d/m/Y h:i A');

        // --- KPIs GLOBALES ---
        $kpis = [
            'ingreso_dia' => (float) $aprobadas->filter(function ($s) use ($hoy) {
                return !empty($s->fecha_solicitud) && substr($s->fecha_solicitud, 0, 10) === $hoy;
            })->sum('costo_tupa'),
            'recaudado_neto' => (float) $aprobadas->sum('costo_tupa'),
            'solicitudes_aceptadas' => $aprobadas->count(),
            'solicitudes_rechazadas' => $rechazadas->count(),
            'copias_emitidas' => (int) $aprobadas->sum('numero_hojas'),
            'copias_simples' => (int) $aprobadas->filter(function ($s) {
                $t = strtolower($s->tipo_formato_tupa ?? '');
                return str_contains($t, 'simple') && !str_contains($t, 'mixto');
            })->sum('numero_hojas'),
            'copias_fedateadas' => (int) $aprobadas->filter(function ($s) {
                $t = strtolower($s->tipo_formato_tupa ?? '');
                return str_contains($t, 'fedat') && !str_contains($t, 'mixto');
            })->sum('numero_hojas'),
            'copias_mixtas' => (int) $aprobadas->filter(function ($s) {
                $t = strtolower($s->tipo_formato_tupa ?? '');
                return str_contains($t, 'mixto');
            })->sum('numero_hojas')
        ];

        // --- DEMANDA DE COPIAS FILTRADA ---
        $aprobadasDemanda = $aprobadas->filter(function ($i) use ($demandaAnio, $demandaMes) {
            if ($demandaAnio !== 'Todos' && !str_starts_with($i->fecha_solicitud ?? '', $demandaAnio)) return false;
            if ($demandaMes !== 'Todos' && substr($i->fecha_solicitud ?? '', 5, 2) !== $demandaMes) return false;
            return true;
        });

        $demanda = [
            [
                'modalidad' => 'Copias Simples A4',
                'tramites'  => $aprobadasDemanda->filter(fn($i) => str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'simple') && !str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'mixto'))->count(),
                'hojas'     => (int) $aprobadasDemanda->filter(fn($i) => str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'simple') && !str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'mixto'))->sum('numero_hojas')
            ],
            [
                'modalidad' => 'Copias Fedateadas',
                'tramites'  => $aprobadasDemanda->filter(fn($i) => str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'fedat') && !str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'mixto'))->count(),
                'hojas'     => (int) $aprobadasDemanda->filter(fn($i) => str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'fedat') && !str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'mixto'))->sum('numero_hojas')
            ],
            [
                'modalidad' => 'Mixtas',
                'tramites'  => $aprobadasDemanda->filter(fn($i) => str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'mixto'))->count(),
                'hojas'     => (int) $aprobadasDemanda->filter(fn($i) => str_contains(strtolower($i->tipo_formato_tupa ?? ''), 'mixto'))->sum('numero_hojas')
            ]
        ];

        // --- HISTORIAL MENSUAL ---
        $mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        $recaudacionMensual = [];
        for ($m = 1; $m <= 12; $m++) {
            $mesStr = str_pad($m, 2, '0', STR_PAD_LEFT);
            $totalMes = $aprobadas->filter(function ($i) use ($tendenciaAnio, $mesStr) {
                if (empty($i->fecha_solicitud)) return false;
                $ano = substr($i->fecha_solicitud, 0, 4);
                $mes = substr($i->fecha_solicitud, 5, 2);
                if ($tendenciaAnio !== 'Todos' && $ano !== $tendenciaAnio) return false;
                return $mes === $mesStr;
            })->sum('costo_tupa');

            $recaudacionMensual[] = [
                'mes'   => $mesesNombres[$m - 1],
                'monto' => (float) $totalMes
            ];
        }

        // --- EXPORTAR EXCEL / CSV ---
        if ($formato === 'excel') {
            $fileName = "Reporte_Costos_Caja_" . Carbon::now('America/Lima')->format('Ymd_His') . ".csv";

            return response()->streamDownload(function () use ($kpis, $demanda, $recaudacionMensual, $fechaGen, $demandaMes, $demandaAnio, $tendenciaAnio) {
                $handle = fopen('php://output', 'w');
                fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
                
                //KPIS
                fputcsv($handle, ['--- INDICADORES GLOBALES DE CAJA ---'], ';');
                fputcsv($handle, ['Metrica', 'Valor'], ';');
                fputcsv($handle, ['Ingreso del Dia', 'S/ ' . number_format($kpis['ingreso_dia'], 2)], ';');
                fputcsv($handle, ['Recaudado Neto', 'S/ ' . number_format($kpis['recaudado_neto'], 2)], ';');
                fputcsv($handle, ['Solicitudes Aceptadas', $kpis['solicitudes_aceptadas']], ';');
                fputcsv($handle, ['Solicitudes Rechazadas', $kpis['solicitudes_rechazadas']], ';');
                fputcsv($handle, ['Total Copias Emitidas (Hojas)', $kpis['copias_emitidas']], ';');
                fputcsv($handle, ['Copias Simples A4 (Hojas)', $kpis['copias_simples']], ';');
                fputcsv($handle, ['Copias Fedateadas (Hojas)', $kpis['copias_fedateadas']], ';');
                fputcsv($handle, ['Copias Mixtas (Hojas)', $kpis['copias_mixtas']], ';');
                fputcsv($handle, [], ';');

                // DEMANDA
                fputcsv($handle, ["--- DEMANDA DE COPIAS (Filtro Mes: $demandaMes | Anio: $demandaAnio) ---"], ';');
                fputcsv($handle, ['Modalidad', 'Tramites Concluidos', 'Total Hojas'], ';');
                foreach ($demanda as $d) {
                    fputcsv($handle, [$d['modalidad'], $d['tramites'], $d['hojas']], ';');
                }
                fputcsv($handle, [], ';');

                // RECAUDACION
                fputcsv($handle, ["--- HISTORIAL DE RECAUDACION (Filtro Anio: $tendenciaAnio) ---"], ';');
                fputcsv($handle, ['Mes', 'Recaudacion'], ';');
                foreach ($recaudacionMensual as $r) {
                    fputcsv($handle, [$r['mes'], 'S/ ' . number_format($r['monto'], 2)], ';');
                }

                fclose($handle);
            }, $fileName, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            ]);
        }

        // --- EXPORTAR PDF (DOMPDF) ---
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        $html = view('reportes.costos_pdf', [
            'kpis'               => $kpis,
            'demanda'            => $demanda,
            'recaudacionMensual' => $recaudacionMensual,
            'fechaGen'           => $fechaGen,
            'demandaMes'         => $demandaMes,
            'demandaAnio'        => $demandaAnio,
            'tendenciaAnio'      => $tendenciaAnio
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"Reporte_Costos_Caja.pdf\"",
        ]);
    }
}