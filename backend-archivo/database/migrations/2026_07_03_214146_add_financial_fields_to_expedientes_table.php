<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->string('razon_social', 255)->nullable()->after('titulo');
            $table->decimal('monto', 10, 2)->nullable()->after('razon_social');
            $table->string('registro_siaf', 50)->nullable()->after('monto');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            //
        });
    }
};