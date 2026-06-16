<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $table = 'areas';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    public function expedientesOrigen()
    {
        return $this->hasMany(Expediente::class, 'area_origen_id');
    }

    public function expedientesActual()
    {
        return $this->hasMany(Expediente::class, 'area_actual_id');
    }
}