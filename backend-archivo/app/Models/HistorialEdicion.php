<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialEdicion extends Model
{
    protected $table = 'historial_ediciones';

    public $timestamps = false;

    protected $fillable = [
        'expediente_id',
        'campo_modificado',
        'valor_anterior',
        'valor_nuevo',
        'usuario_id',
        'fecha_cambio',
        'observaciones',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function expediente()
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }
}
