<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Solicitud extends Model
{
    use HasFactory;

    // 🚀 OBLIGATORIO: Definimos el nombre exacto de la tabla en la base de datos
    protected $table = 'solicitudes';

    // 💰 MASSA ASSIGNMENT BLINDADO: Autorizamos a Laravel a escribir en estos campos desde el controlador
    protected $fillable = [
        'dni',
        'nombres',
        'apellidos',
        'telefono',
        'direccion',
        'expediente_solicitado',
        'descripcion',
        'fecha_solicitud',
        'estado',
        
        // Campos nuevos para el Wizard de Liquidación y Reporte de Costos (TUPA)
        'motivo_rechazo',
        'costo_tupa',
        'tipo_formato_tupa',
        'paginas_simples',
        'paginas_fedateadas',
        'numero_hojas',
        'cantidad_copias',
    ];
}