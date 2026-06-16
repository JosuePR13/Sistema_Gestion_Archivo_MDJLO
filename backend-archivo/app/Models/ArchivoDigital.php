<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArchivoDigital extends Model
{
    protected $table = 'archivos_digitales';

    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'expediente_id',
        'nombre_original',
        'nombre_archivo',
        'ruta_archivo',
        'tipo_mime',
        'tamano_bytes',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function expediente()
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}