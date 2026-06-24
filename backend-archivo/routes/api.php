<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExpedienteController;
use App\Http\Controllers\ArchivoDigitalController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\SolicitudController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/expedientes/{id}/archivos/{archivo_id}', [ArchivoDigitalController::class, 'descargar']);


Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/tipos-documento', [ExpedienteController::class, 'tiposDocumento']);

    Route::post('/expedientes', [ExpedienteController::class, 'store']);
    Route::get('/expedientes/buscar', [ExpedienteController::class, 'search']);
    Route::get('/expedientes', [ExpedienteController::class, 'index']);
    Route::get('/expedientes/{id}', [ExpedienteController::class, 'show']);

    Route::put('/expedientes/{id}', [ExpedienteController::class, 'update']);
    Route::get('/expedientes/{id}/historial', [ExpedienteController::class, 'historial']);
  
    Route::post('/expedientes/{id}/archivos', [ArchivoDigitalController::class, 'subir']);
    Route::get('/expedientes/{id}/archivos', [ArchivoDigitalController::class, 'listar']);
    Route::delete('/expedientes/{id}/archivos/{archivo_id}', [ArchivoDigitalController::class, 'eliminar']);
    

    Route::get('/areas', [AreaController::class, 'index']);
    Route::get('/areas/{id}', [AreaController::class, 'show']);
    Route::post('/areas', [AreaController::class, 'store']);
    Route::put('/areas/{id}', [AreaController::class, 'update']);
    Route::delete('/areas/{id}', [AreaController::class, 'destroy']);

    Route::get('/dashboard/stats', [ReporteController::class, 'stats']);
    Route::get('/reportes/por-area', [ReporteController::class, 'porArea']);
    Route::get('/reportes/digitalizacion', [ReporteController::class, 'digitalizacion']);
    Route::get('/reportes/por-fecha', [ReporteController::class, 'porFecha']);

    Route::apiResource('solicitudes', SolicitudController::class);
});