// src/services/PagoService.ts
import { apiClienteService } from './ApiClienteService';

export interface PagoResponseDTO {
  idPago: number;
  facturaId: number;
  formaPago: 'EFECTIVO' | 'MERCADO_PAGO';
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';
  fechaCreacion: string;
  fechaActualizacion: string;
  monto: number;
  moneda: string;
  descripcion: string;
}

export class PagoService {
  
  /**
   * Obtener factura de un pedido
   */
  async getFacturaPedido(pedidoId: number): Promise<{ idFactura: number; totalVenta: number }> {
    try {
      console.log('📄 Obteniendo factura para pedido:', pedidoId);
      const response = await apiClienteService.get<any>(`/pedidos/${pedidoId}/factura`);
      console.log('✅ Factura completa obtenida:', response);
      
      // Extraer solo los campos que necesitamos
      const facturaInfo = {
        idFactura: response.idFactura,
        totalVenta: response.totalVenta
      };
      
      console.log('📄 Factura procesada:', facturaInfo);
      return facturaInfo;
    } catch (error: any) {
      console.error('❌ Error al obtener factura:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos por factura
   */
  async getPagosByFactura(facturaId: number): Promise<PagoResponseDTO[]> {
    try {
      console.log('🔍 Obteniendo pagos para factura:', facturaId);
      console.log('📡 Llamando a endpoint: /pagos/factura/' + facturaId);
      
      const response = await apiClienteService.get<PagoResponseDTO[]>(`/pagos/factura/${facturaId}`);
      console.log('✅ Pagos obtenidos:', response);
      console.log('📊 Cantidad de pagos:', response.length);
      
      if (response.length === 0) {
        console.log('⚠️ No se encontraron pagos para esta factura');
        console.log('🔍 Esto podría indicar:');
        console.log('   1. El pago no se creó correctamente');
        console.log('   2. El pago se creó con un ID de factura diferente');
        console.log('   3. El endpoint está buscando en la tabla incorrecta');
      } else {
        console.log('📋 Pagos detallados:');
        response.forEach((pago, index) => {
          console.log(`   ${index + 1}. Pago ${pago.idPago}: ${pago.formaPago} - ${pago.estado} - ${pago.monto}`);
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Error al obtener pagos:', error);
      if (error?.response) {
        console.error('📡 Error status:', error.response.status);
        console.error('📡 Error data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Confirmar pago en efectivo (cambiar estado a APROBADO)
   */
  async confirmarPagoEfectivo(pagoId: number): Promise<PagoResponseDTO> {
    try {
      console.log('💵 Confirmando pago en efectivo ID:', pagoId);
      
      const response = await apiClienteService.put<PagoResponseDTO>(
        `/pagos/${pagoId}/estado`,
        { estado: 'APROBADO' }
      );
      
      console.log('✅ Pago confirmado exitosamente:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error al confirmar pago:', error);
      throw error;
    }
  }

  /**
   * Verificar si una factura tiene pagos pendientes en efectivo
   */
  async tienePagosPendientesEfectivo(facturaId: number): Promise<boolean> {
    try {
      console.log('🔍 Verificando pagos pendientes en efectivo para factura:', facturaId);
      const pagos = await this.getPagosByFactura(facturaId);
      console.log('💳 Pagos encontrados para factura', facturaId, ':', pagos);
      
      const pagosPendientesEfectivo = pagos.filter(pago => {
        const esEfectivo = pago.formaPago === 'EFECTIVO';
        const esPendiente = pago.estado === 'PENDIENTE';
        console.log(`💵 Pago ${pago.idPago}: formaPago=${pago.formaPago}, estado=${pago.estado}, esEfectivo=${esEfectivo}, esPendiente=${esPendiente}`);
        return esEfectivo && esPendiente;
      });
      
      console.log('⚠️ Pagos pendientes en efectivo encontrados:', pagosPendientesEfectivo.length);
      console.log('📋 Detalles de pagos pendientes:', pagosPendientesEfectivo);
      
      const tienePendientes = pagosPendientesEfectivo.length > 0;
      console.log('✅ Resultado final - ¿Tiene pagos pendientes?:', tienePendientes);
      
      return tienePendientes;
    } catch (error: any) {
      console.error('❌ Error al verificar pagos pendientes:', error);
      return false;
    }
  }

  /**
   * Obtener pagos pendientes en efectivo de una factura
   */
  async getPagosPendientesEfectivo(facturaId: number): Promise<PagoResponseDTO[]> {
    try {
      const pagos = await this.getPagosByFactura(facturaId);
      return pagos.filter(pago => 
        pago.formaPago === 'EFECTIVO' && pago.estado === 'PENDIENTE'
      );
    } catch (error: any) {
      console.error('❌ Error al obtener pagos pendientes:', error);
      return [];
    }
  }

  /**
   * Verificar si una factura está completamente pagada
   */
  async isFacturaCompletamentePagada(facturaId: number): Promise<boolean> {
    try {
      const response = await apiClienteService.get<boolean>(`/pagos/factura/${facturaId}/completamente-pagada`);
      return response;
    } catch (error: any) {
      console.error('❌ Error al verificar si factura está pagada:', error);
      return false;
    }
  }

  /**
   * Obtener total pagado de una factura
   */
  async getTotalPagadoFactura(facturaId: number): Promise<number> {
    try {
      const response = await apiClienteService.get<number>(`/pagos/factura/${facturaId}/total-pagado`);
      return response;
    } catch (error: any) {
      console.error('❌ Error al obtener total pagado:', error);
      return 0;
    }
  }

  /**
   * Formatear estado del pago para mostrar
   */
  static formatearEstado(estado: string): { texto: string; color: string; icono: string } {
    const estados = {
      PENDIENTE: { texto: 'Pendiente', color: 'yellow', icono: '⏳' },
      APROBADO: { texto: 'Aprobado', color: 'green', icono: '✅' },
      RECHAZADO: { texto: 'Rechazado', color: 'red', icono: '❌' },
      CANCELADO: { texto: 'Cancelado', color: 'gray', icono: '🚫' },
      PROCESANDO: { texto: 'Procesando', color: 'blue', icono: '🔄' },
      REEMBOLSADO: { texto: 'Reembolsado', color: 'purple', icono: '↩️' }
    };

    return estados[estado as keyof typeof estados] || { 
      texto: estado, 
      color: 'gray', 
      icono: '❓' 
    };
  }

  /**
   * Formatear forma de pago
   */
  static formatearFormaPago(formaPago: string): { texto: string; icono: string } {
    const formas = {
      EFECTIVO: { texto: 'Efectivo', icono: '💵' },
      MERCADO_PAGO: { texto: 'MercadoPago', icono: '💳' }
    };

    return formas[formaPago as keyof typeof formas] || { 
      texto: formaPago, 
      icono: '💰' 
    };
  }
}