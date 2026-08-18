<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Reporte de Costos y Caja - MDJLO</title>
    <style>
    @page {
        margin: 22px 28px 35px 28px;
    }

    * {
        box-sizing: border-box;
        font-family: Arial, sans-serif !important;
    }

    body {
        font-size: 9.5px;
        color: #334155;
        margin: 0;
        padding: 0;
    }

    /* BANNER CABECERA */
    .banner-header {
        background-color: #0F4C81;
        border-radius: 10px;
        padding: 12px 16px;
        margin-bottom: 12px;
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
        padding: 5px;
        text-align: center;
        display: inline-block;
    }

    .logo-img {
        max-height: 46px;
        max-width: 130px;
        display: block;
        margin: 0 auto;
    }

    .institution-info {
        text-align: center;
    }

    .institution-info h1 {
        color: #FFFFFF;
        font-size: 16px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0 0 3px 0;
        line-height: 1.15;
    }

    .institution-info p {
        color: #BAE6FD;
        font-size: 9px;
        margin: 0;
        letter-spacing: 0.4px;
        text-transform: uppercase;
    }

    /* CARD FILTROS */
    .filter-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 9px 12px;
        margin-bottom: 12px;
    }

    .report-title-text {
        color: #0F4C81;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        border-bottom: 1px solid #E2E8F0;
        padding-bottom: 5px;
        margin-bottom: 5px;
    }

    /* KPI GRID */
    .kpi-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 6px;
        margin-bottom: 10px;
    }

    .kpi-table td {
        padding: 8px 10px;
        border-radius: 6px;
        vertical-align: middle;
        border: 1px solid transparent;
    }

    .kpi-label {
        font-size: 7.5px;
        font-weight: bold;
        text-transform: uppercase;
        display: block;
        margin-bottom: 2px;
    }

    .kpi-value {
        font-size: 14px;
        font-weight: bold;
    }

    /* TEMAS KPI */
    .kpi-amber {
        background-color: #FFFBEB;
        border-color: #FDE68A;
    }

    .kpi-amber .kpi-label {
        color: #B45309;
    }

    .kpi-amber .kpi-value {
        color: #92400E;
    }

    .kpi-emerald {
        background-color: #ECFDF5;
        border-color: #A7F3D0;
    }

    .kpi-emerald .kpi-label {
        color: #047857;
    }

    .kpi-emerald .kpi-value {
        color: #065F46;
    }

    .kpi-blue {
        background-color: #EFF6FF;
        border-color: #BFDBFE;
    }

    .kpi-blue .kpi-label {
        color: #1D4ED8;
    }

    .kpi-blue .kpi-value {
        color: #1E40AF;
    }

    .kpi-rose {
        background-color: #FFF1F2;
        border-color: #FECDD3;
    }

    .kpi-rose .kpi-label {
        color: #BE123C;
    }

    .kpi-rose .kpi-value {
        color: #9F1239;
    }

    .kpi-purple {
        background-color: #FAF5FF;
        border-color: #E9D5FF;
    }

    .kpi-purple .kpi-label {
        color: #7E22CE;
    }

    .kpi-purple .kpi-value {
        color: #6B21A8;
    }

    .kpi-cyan {
        background-color: #ECFEFF;
        border-color: #A5F3FC;
    }

    .kpi-cyan .kpi-label {
        color: #0E7490;
    }

    .kpi-cyan .kpi-value {
        color: #155E75;
    }

    .kpi-teal {
        background-color: #F0FDFA;
        border-color: #99F6E4;
    }

    .kpi-teal .kpi-label {
        color: #0F766E;
    }

    .kpi-teal .kpi-value {
        color: #115E59;
    }

    .kpi-indigo {
        background-color: #EEF2FF;
        border-color: #C7D2FE;
    }

    .kpi-indigo .kpi-label {
        color: #4338CA;
    }

    .kpi-indigo .kpi-value {
        color: #3730A3;
    }

    /* SECCIONES TABLAS */
    .section-title {
        font-size: 10px;
        font-weight: bold;
        color: #0F4C81;
        text-transform: uppercase;
        margin: 10px 0 5px 0;
        padding-left: 2px;
    }

    table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
    }

    table.data-table th {
        background-color: #0F4C81;
        color: #FFFFFF;
        font-size: 8.5px;
        font-weight: bold;
        text-transform: uppercase;
        padding: 6px;
        text-align: center;
        border: none;
    }

    table.data-table td {
        padding: 6px;
        border-bottom: 1px solid #E2E8F0;
        font-size: 8.5px;
        color: #334155;
        text-align: center;
    }

    table.data-table tbody tr:nth-child(even) {
        background-color: #F8FAFC;
    }
    </style>
</head>

<body>
    <script type="php">
        if (isset($pdf)) {
            $text = "Página " . $PAGE_NUM . " de " . $PAGE_COUNT;
            $size = 8;
            $font = $fontMetrics->getFont("Arial", "normal");
            $width = $fontMetrics->getTextWidth($text, $font, $size);
            $pdf->page_text($pdf->get_width() - $width - 28, $pdf->get_height() - 22, $text, $font, $size, array(0.5, 0.55, 0.6));
            
            $footerText = "Municipalidad Distrital de José Leonardo Ortiz - Auditoría de Caja";
            $pdf->page_text(28, $pdf->get_height() - 22, $footerText, $font, $size, array(0.5, 0.55, 0.6));
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

    <!-- CABECERA -->
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

    <!-- CONTENEDOR FILTROS -->
    <div class="filter-card">
        <div class="report-title-text">
            Reporte de Costos y Auditoría de Caja
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="font-size: 8.5px; color: #64748B; text-align: left;">
                    <strong>Filtro Demanda:</strong> Mes: {{ $demandaMes }} | Año: {{ $demandaAnio }}
                </td>
                <td style="font-size: 8.5px; text-align: right;">
                    <strong style="color: #1E293B;">Generado el:</strong> <span
                        style="color: #64748B;">{{ $fechaGen }}</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- REJILLA DE KPIS (4 x 2) -->
    <table class="kpi-table">
        <tr>
            <td class="kpi-amber" style="width: 25%;">
                <span class="kpi-label">Ingreso del Día</span>
                <span class="kpi-value">S/ {{ number_format($kpis['ingreso_dia'], 2) }}</span>
            </td>
            <td class="kpi-emerald" style="width: 25%;">
                <span class="kpi-label">Recaudado Neto</span>
                <span class="kpi-value">S/ {{ number_format($kpis['recaudado_neto'], 2) }}</span>
            </td>
            <td class="kpi-blue" style="width: 25%;">
                <span class="kpi-label">Solic. Aceptadas</span>
                <span class="kpi-value">{{ $kpis['solicitudes_aceptadas'] }}</span>
            </td>
            <td class="kpi-rose" style="width: 25%;">
                <span class="kpi-label">Solic. Rechazadas</span>
                <span class="kpi-value">{{ $kpis['solicitudes_rechazadas'] }}</span>
            </td>
        </tr>
        <tr>
            <td class="kpi-purple" style="width: 25%;">
                <span class="kpi-label">Copias Emitidas</span>
                <span class="kpi-value">{{ $kpis['copias_emitidas'] }}</span>
            </td>
            <td class="kpi-cyan" style="width: 25%;">
                <span class="kpi-label">Copias Simples A4</span>
                <span class="kpi-value">{{ $kpis['copias_simples'] }}</span>
            </td>
            <td class="kpi-teal" style="width: 25%;">
                <span class="kpi-label">Copias Fedateadas</span>
                <span class="kpi-value">{{ $kpis['copias_fedateadas'] }}</span>
            </td>
            <td class="kpi-indigo" style="width: 25%;">
                <span class="kpi-label">Copias Mixtas</span>
                <span class="kpi-value">{{ $kpis['copias_mixtas'] }}</span>
            </td>
        </tr>
    </table>

    <!-- SECCIÓN 1: DEMANDA DE COPIAS -->
    <div class="section-title">1. Demanda de Copias por Modalidad</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 50%;">Modalidad</th>
                <th style="width: 25%;">Trámites Concluidos</th>
                <th style="width: 25%;">Total Hojas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($demanda as $d)
            <tr>
                <td style="font-weight: bold; color: #0F4C81; text-align: center;">{{ $d['modalidad'] }}</td>
                <td style="font-weight: bold; text-align: center;">{{ $d['tramites'] }}</td>
                <td style="font-weight: bold; color: #15803D; text-align: center;">{{ $d['hojas'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- SECCIÓN 2: HISTORIAL DE RECAUDACIÓN -->
    <div class="section-title">2. Historial de Recaudación Mensual</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 50%;">Mes</th>
                <th style="width: 50%;">Monto Recaudado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($recaudacionMensual as $r)
            <tr>
                <td style="text-align: center;">{{ $r['mes'] }}</td>
                <td style="font-weight: bold; color: #0F4C81; text-align: center;">S/
                    {{ number_format($r['monto'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>