<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Solicitud extends Model
{
    use HasFactory;

    protected $table = 'solicitudes';

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
        'motivo_rechazo',
        'costo_tupa',
        'tipo_formato_tupa',
        'paginas_simples',
        'paginas_fedateadas',
        'numero_hojas',
        'cantidad_copias',
    ];
}