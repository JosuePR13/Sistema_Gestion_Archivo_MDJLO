<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('solicitudes')) {
            Schema::create('solicitudes', function (Blueprint $table) {
                $table->id();
                $table->string('dni', 8);
                $table->string('nombres', 100);
                $table->string('apellidos', 100);
                $table->string('telefono')->nullable();
                $table->string('direccion')->nullable();
                $table->text('expediente_solicitado');
                $table->text('descripcion');
                $table->date('fecha_solicitud');
                $table->string('estado', 20)->default('Pendiente');

                $table->text('motivo_rechazo')->nullable();
                $table->decimal('costo_tupa', 8, 2)->nullable();
                $table->string('tipo_formato_tupa')->nullable();
                $table->string('paginas_simples')->nullable();
                $table->string('paginas_fedateadas')->nullable();
                $table->integer('numero_hojas')->nullable();
                $table->integer('cantidad_copias')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitudes');
    }
};
