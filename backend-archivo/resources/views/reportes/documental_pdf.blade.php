<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Reporte Institucional - MDJLO</title>
    <style>
    @page {
        margin: 25px 30px 45px 30px;
    }

    * {
        box-sizing: border-box;
        font-family: Arial, sans-serif !important;
    }

    body {
        font-size: 10px;
        color: #334155;
        margin: 0;
        padding: 0;
    }

    /* --- BANNER DE CABECERA --- */
    .banner-header {
        background-color: #0F4C81;
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 14px;
    }

    .header-table {
        width: 100%;
        border-collapse: collapse;
    }

    .header-table td {
        vertical-align: middle;
        border: none;
        padding: 0;
    }

    .logo-box {
        background-color: #FFFFFF;
        border-radius: 8px;
        padding: 6px;
        text-align: center;
        display: inline-block;
    }

    .logo-img {
        max-height: 52px;
        max-width: 135px;
        display: block;
        margin: 0 auto;
    }

    .institution-info {
        text-align: center;
    }

    .institution-info h1 {
        color: #FFFFFF;
        font-size: 17px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0 0 4px 0;
        line-height: 1.15;
    }

    .institution-info p {
        color: #BAE6FD;
        font-size: 9.5px;
        margin: 0;
        letter-spacing: 0.4px;
        text-transform: uppercase;
    }

    /* --- BARRA DE FILTROS --- */
    .filter-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 14px;
    }

    .filter-card table {
        width: 100%;
        border-collapse: collapse;
        border: none;
        margin: 0;
    }

    .filter-card td {
        border: none !important;
        padding: 0;
        background: transparent;
    }

    /* Título con línea divisoria gris y delgada */
    .report-title-text {
        color: #0F4C81;
        font-size: 11.5px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        border-bottom: 1px solid #E2E8F0;
        padding-bottom: 6px;
        margin-bottom: 6px;
    }

    .filter-details-row {
        font-size: 8.5px;
        color: #64748B;
        text-align: left;
    }

    .filter-details-row strong {
        color: #334155;
    }

    .count-gray {
        color: #64748B;
        font-weight: normal;
    }

    .report-date-text {
        font-size: 8.5px;
        text-align: right;
    }

    .report-date-text strong {
        color: #1E293B;
        font-weight: bold;
    }

    .report-date-text span {
        color: #64748B;
    }

    /* --- TABLA DE DATOS --- */
    table.data-table {
        width: 100%;
        border-collapse: collapse;
    }

    thead {
        display: table-header-group;
    }

    tr {
        page-break-inside: avoid;
    }

    th {
        background-color: #0F4C81;
        color: #FFFFFF;
        font-size: 8.5px;
        font-weight: bold;
        text-transform: uppercase;
        padding: 8px 5px;
        letter-spacing: 0.3px;
        text-align: center;
        border: none;
    }

    .data-table td {
        padding: 8px 5px;
        border-bottom: 1px solid #E2E8F0;
        font-size: 8.5px;
        color: #334155;
        vertical-align: middle;
        text-align: center;
    }

    .data-table tbody tr:nth-child(even) {
        background-color: #F8FAFC;
    }

    /* --- ESTILOS DE TEXTO --- */
    .text-code {
        color: #0F4C81;
        font-weight: bold;
        font-size: 8.5px;
    }

    .text-bold {
        font-weight: bold;
        color: #0F172A;
    }

    /* --- BADGES --- */
    .status-badge {
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 7.5px;
        font-weight: bold;
        text-transform: uppercase;
        display: inline-block;
        letter-spacing: 0.2px;
    }

    .badge-digital {
        background-color: #DCFCE7;
        color: #15803D;
        border: 1px solid #BBF7D0;
    }

    .badge-pending {
        background-color: #FFE4E6;
        color: #E11D48;
        border: 1px solid #FECDD3;
    }
    </style>
</head>

<body>
    <!-- Numeración de páginas -->
    <script type="php">
        if (isset($pdf)) {
            $text = "Página " . $PAGE_NUM . " de " . $PAGE_COUNT;
            $size = 8;
            $font = $fontMetrics->getFont("Arial", "normal");
            $width = $fontMetrics->getTextWidth($text, $font, $size);
            $pdf->page_text($pdf->get_width() - $width - 30, $pdf->get_height() - 25, $text, $font, $size, array(0.5, 0.55, 0.6));
            
            $footerText = "Municipalidad Distrital de José Leonardo Ortiz - Archivo Central";
            $pdf->page_text(30, $pdf->get_height() - 25, $footerText, $font, $size, array(0.5, 0.55, 0.6));
        }
    </script>

    @php
    $logoPath = public_path('img/logo_muni.png');
    $logoBase64 = '';
    if (file_exists($logoPath)) {
    $logoData = file_get_contents($logoPath);
    $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
    }
    @endphp

    <!-- CABECERA INSTITUCIONAL -->
    <div class="banner-header">
        <table class="header-table">
            <tr>
                <td style="width: 25%; text-align: left;">
                    <div class="logo-box">
                        @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo">
                        @else
                        <span style="font-weight: bold; color: #0F4C81; font-size: 14px;">MDJLO</span>
                        @endif
                    </div>
                </td>
                <td style="width: 50%;" class="institution-info">
                    <h1>Municipalidad Distrital de<br>José Leonardo Ortiz</h1>
                    <p>Unidad Funcional de Archivo y Acceso Documentario</p>
                </td>
                <td style="width: 25%;"></td>
            </tr>
        </table>
    </div>

    <!-- CONTENEDOR DE FILTROS Y RESUMEN -->
    <div class="filter-card">
        <div class="report-title-text">
            {{ $tipo == 'registrados' ? 'Reporte: Documentos Registrados' : ($tipo == 'digitalizacion' ? 'Reporte: Avance de Digitalización' : 'Reporte: Tipología Documental') }}
        </div>

        <table>
            <tr>
                <td style="width: 65%;" class="filter-details-row">
                    <strong>Año:</strong> {{ $anio }} &nbsp;|&nbsp;
                    <strong>Mes:</strong> {{ $mes }} &nbsp;|&nbsp;
                    <strong>Área:</strong> {{ $area }} &nbsp;|&nbsp;
                    <strong>Total Registros:</strong> <span
                        class="count-gray">{{ $tipo === 'tipologia' ? count($listaTipos) : count($expedientes) }}</span>
                </td>
                <td style="width: 35%;" class="report-date-text">
                    <strong>Generado el:</strong> <span>{{ $fechaGen }}</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- TABLA DE DATOS -->
    <table class="data-table">
        <thead>
            @if($tipo === 'registrados')
            <tr>
                <th style="width: 20%;">N° Exp / Doc</th>
                <th style="width: 36%;">Título</th>
                <th style="width: 24%;">Área Origen</th>
                <th style="width: 8%;">Folios</th>
                <th style="width: 12%;">Fecha</th>
            </tr>
            @elseif($tipo === 'digitalizacion')
            <tr>
                <th style="width: 20%;">N° Exp / Doc</th>
                <th style="width: 36%;">Título</th>
                <th style="width: 22%;">Área Origen</th>
                <th style="width: 11%;">Estado</th>
                <th style="width: 11%;">Fecha</th>
            </tr>
            @elseif($tipo === 'tipologia')
            <tr>
                <th style="width: 44%;">Tipo Documental</th>
                <th style="width: 18%;">Total Registros</th>
                <th style="width: 19%;">Digitalizados</th>
                <th style="width: 19%;">Físicos</th>
            </tr>
            @endif
        </thead>
        <tbody>
            @if($tipo === 'tipologia')
            @forelse($listaTipos as $t)
            <tr>
                <td class="text-bold" style="color: #0F4C81;">{{ $t['tipo'] }}</td>
                <td class="text-bold">{{ $t['total'] }}</td>
                <td class="text-bold" style="color: #15803D;">{{ $t['digi'] }}</td>
                <td class="text-bold" style="color: #E11D48;">{{ $t['total'] - $t['digi'] }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="padding: 20px; color: #94A3B8;">No se encontraron registros.</td>
            </tr>
            @endforelse
            @else
            @forelse($expedientes as $exp)
            <tr>
                <td class="text-code">{{ $exp->numero_expediente }}</td>
                <td>{{ $exp->titulo }}</td>
                <td>{{ $exp->areaOrigen->nombre ?? 'Desconocida' }}</td>

                @if($tipo === 'registrados')
                <td class="text-bold">{{ $exp->numero_folios ?? 0 }}</td>
                @elseif($tipo === 'digitalizacion')
                <td>
                    @if($exp->digitalizado == 1 || $exp->digitalizado === true)
                    <span class="status-badge badge-digital">Digitalizado</span>
                    @else
                    <span class="status-badge badge-pending">Pendiente</span>
                    @endif
                </td>
                @endif

                <td>{{ substr($exp->fecha_ingreso ?? $exp->created_at, 0, 10) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="padding: 20px; color: #94A3B8;">No se encontraron registros para este periodo.
                </td>
            </tr>
            @endforelse
            @endif
        </tbody>
    </table>
</body>

</html>