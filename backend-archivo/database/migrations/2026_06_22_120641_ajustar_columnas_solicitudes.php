<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->text('expediente_solicitado')->change();

            $table->string('estado', 20)
                ->default('Pendiente')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->string('expediente_solicitado', 255)->change();

            $table->enum('estado', [
                'Pendiente',
                'Aceptada',
                'Rechazada'
            ])->default('Pendiente')->change();
        });
    }
};