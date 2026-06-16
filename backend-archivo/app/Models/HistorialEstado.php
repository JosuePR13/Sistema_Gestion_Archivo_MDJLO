<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialEstado extends Model
{
    protected $table = 'historial_estados';

    public $timestamps = false;

    protected $fillable = [
        'expediente_id',
        'estado_anterior',
        'estado_nuevo',
        'usuario_id',
        'fecha_cambio',
        'observaciones',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}