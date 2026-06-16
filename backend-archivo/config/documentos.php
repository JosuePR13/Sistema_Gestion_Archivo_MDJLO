<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuración de Documentos
    |--------------------------------------------------------------------------
    */

    // Tamaño máximo de archivo en bytes (50MB)
    'tamaño_maximo' => env('DOCUMENTO_TAMAÑO_MAXIMO', 50 * 1024 * 1024),

    // Tipos MIME permitidos
    'tipos_mime_permitidos' => [
        'application/pdf',
    ],

    // Extensiones permitidas
    'extensiones_permitidas' => [
        'pdf',
    ],

    // Ruta de almacenamiento
    'ruta_almacenamiento' => 'documentos',

    // Ruta privada (no servir directamente)
    'ruta_privada' => storage_path('app/documentos'),

    // Habilitar antivirus (futuro)
    'escanear_virus' => env('DOCUMENTO_ESCANEAR_VIRUS', false),

    // Límite de descargas por usuario por hora
    'limite_descargas_hora' => 100,

    // Retener registros de auditoría por días
    'dias_retencion_auditoria' => 90,
];
