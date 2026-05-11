const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const FormatUtils = require('../utils/FormatUtils');
const ConfiguracionService = require('./ConfiguracionService');
const EnvioCorreo = require('../config/correo');
const VentaService = require('./VentaService');
const Venta = require('../models/Venta');
const VentaPago = require('../models/VentaPago');
const VentaPagoAgrupado = require('../models/VentaPagoAgrupado');
const VentaProducto = require('../models/VentaProducto');
const VentaCashea = require('../models/VentaCashea');
const VentaCasheaCuota = require('../models/VentaCasheaCuota');
const VentaConsulta = require('../models/VentaConsulta');
const HistorialMedico = require('../models/HistorialMedico');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Tasa = require('../models/Tasa');
const CierreCaja = require('../models/CierreCaja');
const CierreCajaTransaccionManual = require('../models/CierreCajaTransaccionManual');
const CierreCajaConciliacion = require('../models/CierreCajaConciliacion');
const VerificationUtils = require('../utils/VerificationUtils');

const VENTA_INCLUDE = [
  { model: VentaPago, as: 'array_pagos' },
  { model: VentaPagoAgrupado, as: 'array_pagos_agrupados' },
  { model: VentaConsulta, as: 'venta_consulta' },
  {
    model: VentaProducto,
    as: 'array_productos',
    include: [
      {
        model: Producto,
        as: 'datos_producto',
        attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo', 'precio', 'stock']
      }
    ]
  },
  { model: VentaCashea, as: 'datos_cashea' },
  { model: VentaCasheaCuota, as: 'cuotas_cashea' },
  { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'], required: false },
  { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'], required: false },
  { model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'], required: false },
  { model: HistorialMedico, as: 'historia_medica', required: false }
];

const CierreCajaService = {
  decodificarTokenPublico(token) {
    const valor = String(token || '').trim();
    if (!valor) {
      throw { message: 'El token del cierre es obligatorio.' };
    }

    try {
      const base64 = valor.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(valor.length / 4) * 4, '=');
      const json = Buffer.from(base64, 'base64').toString('utf8');
      const payload = JSON.parse(json);
      const sede = String(payload?.sede || '').trim().toLowerCase();
      const fecha = String(payload?.fecha || '').trim();

      if (!sede || !fecha) {
        throw new Error('Token incompleto.');
      }

      return { sede, fecha };
    } catch (error) {
      throw { message: 'El token del cierre no es valido.' };
    }
  },

  normalizarFecha(fechaInput) {
    if (!fechaInput) {
      throw { message: 'La fecha es obligatoria.' };
    }

    if (fechaInput instanceof Date) {
      if (Number.isNaN(fechaInput.getTime())) {
        throw { message: 'La fecha enviada es inválida.' };
      }

      return new Date(fechaInput.getFullYear(), fechaInput.getMonth(), fechaInput.getDate(), 0, 0, 0, 0);
    }

    const texto = String(fechaInput).trim();
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw { message: 'La fecha debe tener el formato YYYY-MM-DD.' };
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0);
    if (Number.isNaN(date.getTime())) {
      throw { message: 'La fecha enviada es inválida.' };
    }

    return date;
  },

  formatearFecha(fecha) {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatearFechaHumana(fechaInput) {
    if (!fechaInput) {
      return '';
    }

    const texto = String(fechaInput).trim();
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }

    try {
      const fecha = this.normalizarFecha(fechaInput);
      const day = `${fecha.getDate()}`.padStart(2, '0');
      const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
      const year = fecha.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return texto;
    }
  },

  esMismaFechaOperativa(fechaA, fechaB) {
    return this.formatearFecha(this.normalizarFecha(fechaA)) === this.formatearFecha(this.normalizarFecha(fechaB));
  },

  construirCierreId(fecha, sedeId) {
    return `CIERRE-${this.formatearFecha(fecha)}-${sedeId}`;
  },

  obtenerRangoDia(fecha) {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
    const fin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);
    return { inicio, fin };
  },

  async resolverSedeOperacion(req, sedeSolicitada, permitirOtraSede = false) {
    const sedeNormalizada = String(sedeSolicitada || '').trim().toLowerCase();

    if (!permitirOtraSede || !sedeNormalizada || sedeNormalizada === req.sede.id) {
      return req.sede.id;
    }

    const rolKey = `${req.user?.rol?.id || ''}`.trim().toLowerCase();
    if (!['admin', 'gerente'].includes(rolKey)) {
      throw { message: 'No tienes permisos para operar sobre otra sede.' };
    }

    return sedeNormalizada;
  },

  async obtenerMonedaPrincipal(sedeId) {
    const monedaBase = await ConfiguracionService.get_moneda_base(sedeId);
    return monedaBase.valor;
  },

  async obtenerTasasActualesPorId() {
    const tasas = await Tasa.findAll({ attributes: ['id', 'valor'] });
    const output = { bolivar: 1 };

    tasas.forEach((tasa) => {
      output[tasa.id] = Number(tasa.valor || 0);
    });

    if (!output.bolivar) {
      output.bolivar = 1;
    }

    return output;
  },

  construirTasasCambio(monedaPrincipal, tasasPorId) {
    const tasaDolar = Number(tasasPorId.dolar || 1);
    const tasaEuro = Number(tasasPorId.euro || 1);

    if (monedaPrincipal === 'EUR') {
      return {
        dolar: tasaDolar > 0 && tasaEuro > 0 ? FormatUtils.float(tasaDolar / tasaEuro) : 1,
        euro: 1,
        bolivar: tasaEuro > 0 ? Number((1 / tasaEuro).toFixed(6)) : 1
      };
    }

    if (monedaPrincipal === 'bolivar') {
      return {
        dolar: tasaDolar,
        euro: tasaEuro,
        bolivar: 1
      };
    }

    return {
      dolar: 1,
      euro: tasaDolar > 0 && tasaEuro > 0 ? FormatUtils.float(tasaEuro / tasaDolar) : 1,
      bolivar: tasaDolar > 0 ? Number((1 / tasaDolar).toFixed(6)) : 1
    };
  },

  normalizarCodigoMoneda(moneda) {
    const valor = String(moneda || '').trim().toLowerCase();
    if (['usd', 'dolar', 'dólar'].includes(valor)) return 'dolar';
    if (['eur', 'euro'].includes(valor)) return 'euro';
    if (['ves', 'bs', 'bolivar', 'bolívar'].includes(valor)) return 'bolivar';
    return valor || 'dolar';
  },

  convertirMonto(monto, monedaOrigen, monedaDestino, tasasActuales = []) {
    const origen = this.normalizarCodigoMoneda(monedaOrigen);
    const destino = this.normalizarCodigoMoneda(monedaDestino);

    if (origen === destino) {
      return FormatUtils.float(monto || 0);
    }

    const buscarTasa = (moneda) => {
      if (moneda === 'bolivar') {
        return 1;
      }

      const tasa = tasasActuales.find((item) => `${item.id || item.moneda}`.trim().toLowerCase() === moneda);
      return tasa ? Number(tasa.valor || tasa.tasa || 0) : null;
    };

    const tasaOrigen = buscarTasa(origen);
    const tasaDestino = buscarTasa(destino);

    if (!tasaOrigen || !tasaDestino) {
      return FormatUtils.float(monto || 0);
    }

    return FormatUtils.float((Number(monto || 0) * tasaOrigen) / tasaDestino);
  },

  async obtenerVentasDelDia(fecha, sedeId) {
    const { inicio, fin } = this.obtenerRangoDia(fecha);
    const ventas = await Venta.findAll({
      where: {
        sede: sedeId,
        fecha: { [Op.between]: [inicio, fin] },
        estatus_venta: { [Op.ne]: 'anulada' }
      },
      include: VENTA_INCLUDE,
      order: [['fecha', 'ASC']]
    });

    const output = [];
    for (const venta of ventas) {
      output.push(await VentaService.formatear_venta_output(venta));
    }

    return { ventas, ventasFormateadas: output };
  },

  async obtenerAbonosDelDia(fecha, sedeId) {
    const { inicio, fin } = this.obtenerRangoDia(fecha);
    const gruposAbonos = await VentaPagoAgrupado.findAll({
      where: {
        created_at: { [Op.between]: [inicio, fin] },
        numero_pago: { [Op.gte]: 2 }
      },
      attributes: ['venta_key']
    });

    const ventaKeys = Array.from(new Set(
      gruposAbonos
        .map((item) => String(item.venta_key || '').trim())
        .filter(Boolean)
    ));

    if (!ventaKeys.length) {
      return [];
    }

    const ventas = await Venta.findAll({
      where: {
        venta_key: { [Op.in]: ventaKeys },
        sede: sedeId,
        estatus_venta: { [Op.ne]: 'anulada' }
      },
      include: VENTA_INCLUDE,
      order: [['fecha', 'ASC']]
    });

    const output = [];

    for (const venta of ventas) {
      const ventaFormateada = await VentaService.formatear_venta_output(venta);
      const fechaVenta = new Date(ventaFormateada?.fecha || venta?.fecha);
      const ventaEsDelDia = !Number.isNaN(fechaVenta.getTime()) && fechaVenta >= inicio && fechaVenta <= fin;

      if (ventaEsDelDia) {
        continue;
      }

      const abonos = Array.isArray(ventaFormateada?.formaPagoDetalle?.abonos)
        ? ventaFormateada.formaPagoDetalle.abonos
        : [];

      for (const abono of abonos) {
        const fechaAbono = new Date(abono?.fecha);
        if (Number.isNaN(fechaAbono.getTime()) || fechaAbono < inicio || fechaAbono > fin) {
          continue;
        }

        const grupoAbono = Array.isArray(venta.array_pagos_agrupados)
          ? venta.array_pagos_agrupados.find((item) => Number(item?.numero_pago) === Number(abono?.numero))
          : null;
        const usuarioAbono = grupoAbono?.created_by
          ? await this.obtenerNombreUsuario(grupoAbono.created_by)
          : null;

        output.push({
          id: `ABONO-${ventaFormateada?.key || venta.venta_key}-${abono?.numero || fechaAbono.getTime()}`,
          ventaKey: ventaFormateada?.key || venta.venta_key,
          numeroVenta: ventaFormateada?.numero_venta || null,
          fecha: abono?.fecha,
          montoAbonado: Number(abono?.montoAbonado || 0),
          deudaPendiente: Number(abono?.deudaPendiente || 0),
          observaciones: abono?.observaciones || '',
          moneda: ventaFormateada?.moneda || venta?.moneda || 'dolar',
          totalVenta: Number(ventaFormateada?.total || venta?.total || 0),
          formaPago: ventaFormateada?.formaPago || venta?.forma_pago || 'abono',
          sede: ventaFormateada?.sede || venta?.sede || sedeId,
          tipoVenta: ventaFormateada?.tipoVenta || venta?.tipo_venta || 'solo_productos',
            tasasActuales: Array.isArray(abono?.tasasActuales) && abono.tasasActuales.length
              ? abono.tasasActuales
              : Array.isArray(ventaFormateada?.formaPagoDetalle?.tasasActuales)
                ? ventaFormateada.formaPagoDetalle.tasasActuales
                : [],
          metodosDePago: Array.isArray(abono?.metodosDePago) ? abono.metodosDePago : [],
          cliente: ventaFormateada?.cliente?.informacion || ventaFormateada?.cliente || {},
          asesor: ventaFormateada?.asesor || {},
          usuario: usuarioAbono || ventaFormateada?.asesor?.nombre || ventaFormateada?.auditoria?.usuarioCreacion?.nombre || 'Usuario'
        });
      }
    }

    return output.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  },

  async obtenerCierrePorFechaSede(fecha, sedeId) {
    return CierreCaja.findOne({ where: { fecha: this.formatearFecha(fecha), sede: sedeId } });
  },

  async obtenerCierrePendienteAnterior(fecha, sedeId) {
    return CierreCaja.findOne({
      where: {
        sede: sedeId,
        fecha: { [Op.lt]: this.formatearFecha(fecha) },
        estado: { [Op.in]: ['abierto', 'revisado'] }
      },
      order: [['fecha', 'DESC'], ['created_at', 'DESC']]
    });
  },

  async mapCierrePendienteAnterior(cierre) {
    if (!cierre) {
      return null;
    }

    return {
      id: cierre.id,
      fecha: cierre.fecha,
      fechaFormateada: this.formatearFechaHumana(cierre.fecha),
      sede: cierre.sede,
      estado: cierre.estado,
      fechaApertura: cierre.fecha_apertura,
      fechaCierre: cierre.fecha_cierre,
      usuarioApertura: await this.obtenerNombreUsuario(cierre.usuario_apertura_cedula)
    };
  },

  construirMensajeCierrePendienteAnterior(cierrePendiente, fechaObjetivo, accion = 'continuar') {
    const fechaPendiente = cierrePendiente?.fechaFormateada || this.formatearFechaHumana(cierrePendiente?.fecha);
    return `Existe una caja pendiente del ${fechaPendiente} en estado ${cierrePendiente?.estado || 'abierto'}. Debes conciliarla y cerrarla antes de ${accion}.`;
  },

  async obtenerBloqueoCierrePendienteAnterior(fecha, sedeId, accion = 'continuar') {
    const cierrePendiente = await this.obtenerCierrePendienteAnterior(fecha, sedeId);
    if (!cierrePendiente) {
      return null;
    }

    const cierrePendienteAnterior = await this.mapCierrePendienteAnterior(cierrePendiente);
    return {
      code: 'CIERRE_PENDIENTE_ANTERIOR',
      message: this.construirMensajeCierrePendienteAnterior(cierrePendienteAnterior, fecha, accion),
      cierrePendienteAnterior
    };
  },

  async validarSinCierresPendientesAnteriores(fecha, sedeId, accion = 'continuar') {
    const bloqueo = await this.obtenerBloqueoCierrePendienteAnterior(fecha, sedeId, accion);
    if (bloqueo) {
      throw bloqueo;
    }
  },

  async obtenerCierrePorId(cierreId) {
    return CierreCaja.findOne({ where: { id: cierreId } });
  },

  async obtenerTransaccionesManuales(cierreId) {
    return CierreCajaTransaccionManual.findAll({
      where: { cierre_id: cierreId },
      order: [['fecha', 'ASC'], ['created_at', 'ASC']]
    });
  },

  async obtenerConciliaciones(cierreId) {
    return CierreCajaConciliacion.findAll({
      where: { cierre_id: cierreId },
      order: [['metodo', 'ASC'], ['destino_label', 'ASC'], ['id', 'ASC']]
    });
  },

  async obtenerNombreUsuario(cedula) {
    if (!cedula) {
      return null;
    }

    const usuario = await Usuario.findOne({ where: { cedula }, attributes: ['cedula', 'nombre'] });
    return usuario?.nombre || cedula;
  },

  calcularEstadisticasVentas(ventas) {
    return {
      totalVentas: FormatUtils.float(ventas.reduce((sum, venta) => sum + Number(venta.formaPagoDetalle?.totalPagado || venta.total || 0), 0)),
      cantidadVentas: ventas.length
    };
  },

  calcularResumenOperativo(ventas, transaccionesManuales, monedaPrincipal) {
    const output = {
      ingresos: 0,
      egresos: 0,
      neto: 0,
      ventasContado: 0,
      ventasCredito: 0,
      ventasPendientes: 0
    };

    ventas.forEach((venta) => {
      const tasasActuales = Array.isArray(venta.tasas_actuales) ? venta.tasas_actuales : [];
      const totalPagado = this.convertirMonto(
        venta.total_pagado || venta.total || 0,
        venta.moneda,
        monedaPrincipal,
        tasasActuales
      );
      const totalVenta = this.convertirMonto(venta.total || 0, venta.moneda, monedaPrincipal, tasasActuales);
      const deuda = this.convertirMonto(
        Math.max(0, Number(venta.total || 0) - Number(venta.total_pagado || 0)),
        venta.moneda,
        monedaPrincipal,
        tasasActuales
      );

      output.ingresos += totalPagado;

      if (venta.forma_pago === 'contado') {
        output.ventasContado += totalPagado;
      }

      if (['abono', 'cashea'].includes(venta.forma_pago)) {
        output.ventasCredito += deuda;
      }

      if (venta.forma_pago === 'de_contado-pendiente') {
        output.ventasPendientes += totalVenta;
      }
    });

    transaccionesManuales.forEach((transaccion) => {
      if (transaccion.tipo === 'ingreso') {
        output.ingresos += Number(transaccion.monto_sistema || 0);
      }

      if (transaccion.tipo === 'egreso') {
        output.egresos += Number(transaccion.monto_sistema || 0);
      }
    });

    output.ingresos = FormatUtils.float(output.ingresos);
    output.egresos = FormatUtils.float(output.egresos);
    output.neto = FormatUtils.float(output.ingresos - output.egresos);
    output.ventasContado = FormatUtils.float(output.ventasContado);
    output.ventasCredito = FormatUtils.float(output.ventasCredito);
    output.ventasPendientes = FormatUtils.float(output.ventasPendientes);

    return output;
  },

  async obtenerDestinatariosCorreoCierre(sedeId) {
    const configuracion = await ConfiguracionService.get_correos_notificacion(sedeId);
    const candidatos = [
      {
        correo: String(configuracion?.correo_notificacion_1?.valor || '').trim(),
        activo: String(configuracion?.correo_activo_1?.valor || '1').trim() !== '0'
      },
      {
        correo: String(configuracion?.correo_notificacion_2?.valor || '').trim(),
        activo: String(configuracion?.correo_activo_2?.valor || '1').trim() !== '0'
      }
    ];

    return Array.from(new Set(
      candidatos
        .filter((item) => item.activo && VerificationUtils.verify_correo(item.correo))
        .map((item) => item.correo.toLowerCase())
    ));
  },

  construirHtmlCorreoCierre(payload) {
    const fecha = this.formatearFechaHumana(payload?.fecha);
    const sede = String(payload?.sede || '').trim() || 'general';
    const usuario = String(payload?.usuarioCierre || '').trim() || 'Sistema';
    const diferencia = FormatUtils.float(payload?.diferencia || 0);
    const estado = String(payload?.estadoConciliacion || '').trim() || 'cuadrado';
    const notas = String(payload?.notasCierre || '').trim() || 'Sin observaciones';
    const publicUrl = String(payload?.documentoPdf?.publicUrl || '').trim();
    const publicPrintUrl = String(payload?.documentoPdf?.publicPrintUrl || publicUrl).trim();

    return `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;color:#102a43;">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #d9e2ec;border-radius:18px;overflow:hidden;box-shadow:0 18px 36px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#0f4c81 0%,#3f8fc9 100%);padding:24px 28px;color:#ffffff;">
            <div style="font-size:14px;opacity:0.9;margin-bottom:6px;">Óptica New Vision</div>
            <div style="font-size:30px;font-weight:700;line-height:1.1;">Reporte de cierre de caja</div>
            <div style="font-size:15px;opacity:0.92;margin-top:8px;">Sede ${sede} · Fecha ${fecha}</div>
          </div>
          <div style="padding:28px 28px 34px;">
            <table role="presentation" width="100%" style="width:100%;border-collapse:separate;border-spacing:0 14px;">
              <tr>
                <td>
                  <table role="presentation" width="100%" style="width:100%;border-collapse:separate;border-spacing:0;">
                    <tr>
                      <td valign="top" style="width:50%;padding:0 7px 0 0;">
                        <div style="border:1px solid #d9e2ec;border-radius:14px;padding:16px;background:#f8fbff;min-height:98px;">
                          <div style="font-size:12px;color:#627d98;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Responsable del cierre</div>
                          <div style="font-size:20px;font-weight:700;margin-top:10px;line-height:1.35;color:#102a43;">${usuario}</div>
                        </div>
                      </td>
                      <td valign="top" style="width:50%;padding:0 0 0 7px;">
                        <div style="border:1px solid #d9e2ec;border-radius:14px;padding:16px;background:#f8fbff;min-height:98px;">
                          <div style="font-size:12px;color:#627d98;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Estado conciliación</div>
                          <div style="font-size:20px;font-weight:700;margin-top:10px;line-height:1.35;color:#102a43;">${estado}</div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <div style="border:1px solid #d9e2ec;border-radius:14px;padding:16px;background:#f8fbff;">
                    <div style="font-size:12px;color:#627d98;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Diferencia total</div>
                    <div style="font-size:22px;font-weight:700;margin-top:10px;line-height:1.3;color:${diferencia === 0 ? '#102a43' : diferencia > 0 ? '#0f766e' : '#b42318'};">${FormatUtils.float(diferencia)}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div style="border:1px solid #d9e2ec;border-radius:14px;padding:16px;background:#ffffff;">
                    <div style="font-size:12px;color:#627d98;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Notas del cierre</div>
                    <div style="font-size:15px;line-height:1.7;color:#243b53;margin-top:10px;">${notas}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-top:6px;">
                  <table role="presentation" style="border-collapse:separate;border-spacing:0;">
                    <tr>
                      <td style="padding:0 10px 0 0;">
                        <a href="${publicUrl}" style="display:inline-block;background:#0f4c81;color:#ffffff;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:700;">Abrir cierre</a>
                      </td>
                      <td>
                        <a href="${publicPrintUrl}" style="display:inline-block;background:#e6f0f8;color:#0f4c81;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:700;border:1px solid #bfd4e5;">Abrir para imprimir</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:6px;">
                  <div style="border-top:1px solid #e7eef5;padding-top:16px;color:#6b7c93;font-size:12px;line-height:1.7;text-align:center;">
                    <div>&copy; 2025 Óptica New Vision Lens 2020</div>
                    <div>Operación centralizada para ${sede}</div>
                    <div>v1.0</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async enviarCorreoCierreCaja({ cierre, payload, req }) {
    if (payload?.opciones?.enviarEmail !== true) {
      return { enviado: false, motivo: 'opcion-deshabilitada' };
    }

    if (!payload?.documentoPdf?.publicUrl) {
      return { enviado: false, motivo: 'url-publica-no-disponible' };
    }

    const destinatarios = await this.obtenerDestinatariosCorreoCierre(cierre.sede);
    if (!destinatarios.length) {
      return { enviado: false, motivo: 'sin-destinatarios-configurados' };
    }

    const asunto = `Cierre de caja ${this.formatearFechaHumana(payload?.fecha || cierre.fecha)} · ${cierre.sede}`;
    const html = this.construirHtmlCorreoCierre({
      fecha: payload?.fecha || cierre.fecha,
      sede: cierre.sede,
      usuarioCierre: req?.user?.nombre,
      diferencia: payload?.diferenciaTotal,
      estadoConciliacion: payload?.estadoConciliacion,
      notasCierre: payload?.notasCierre,
      documentoPdf: payload?.documentoPdf
    });

    const info = await EnvioCorreo.send(destinatarios.join(','), asunto, html);
    return {
      enviado: true,
      destinatarios,
      messageId: info?.messageId || null
    };
  },

  agruparConciliaciones(conciliaciones) {
    const output = {
      punto: [],
      transferencia: [],
      pagomovil: [],
      zelle: []
    };

    conciliaciones.forEach((item) => {
      if (!output[item.metodo]) {
        output[item.metodo] = [];
      }

      output[item.metodo].push({
        banco: item.banco,
        bancoCodigo: item.banco_codigo,
        destinoKey: item.destino_key,
        destinoLabel: item.destino_label,
        montoSistema: FormatUtils.float(item.monto_sistema || 0),
        montoReal: FormatUtils.float(item.monto_real || 0),
        diferencia: FormatUtils.float(item.diferencia || 0),
        cantidadSistema: item.cantidad_sistema,
        cantidadReal: item.cantidad_real
      });
    });

    return output;
  },

  mapTransaccionManualOutput(transaccion, nombreUsuario = null) {
    return {
      id: transaccion.id,
      cierreId: transaccion.cierre_id,
      fecha: transaccion.fecha,
      tipo: transaccion.tipo,
      descripcion: transaccion.descripcion,
      monto: FormatUtils.float(transaccion.monto || 0),
      moneda: transaccion.moneda,
      montoSistema: FormatUtils.float(transaccion.monto_sistema || 0),
      metodoPago: transaccion.metodo_pago,
      categoria: transaccion.categoria,
      observaciones: transaccion.observaciones,
      comprobante: transaccion.comprobante,
      usuario: nombreUsuario || transaccion.usuario_cedula,
      estado: transaccion.estado,
      origen: transaccion.origen
    };
  },

  async mapCierreOutput(cierre, opciones = {}) {
    if (!cierre) {
      return null;
    }

    const incluirDetalle = opciones.incluirDetalle === true;
    const totalesOverride = opciones.totalesOverride || null;
    const transaccionesManuales = opciones.transaccionesManuales || [];
    const conciliaciones = opciones.conciliaciones || [];

    const usuarioAperturaNombre = await this.obtenerNombreUsuario(cierre.usuario_apertura_cedula);
    const usuarioCierreNombre = await this.obtenerNombreUsuario(cierre.usuario_cierre_cedula);

    const output = {
      id: cierre.id,
      fecha: cierre.fecha,
      estado: cierre.estado,
      sede: cierre.sede,
      usuarioApertura: usuarioAperturaNombre,
      usuarioCierre: usuarioCierreNombre,
      fechaApertura: cierre.fecha_apertura,
      fechaCierre: cierre.fecha_cierre,
      fechaRevision: cierre.fecha_revision,
      monedaPrincipal: cierre.moneda_principal,
      tasasCambio: {
        dolar: Number(cierre.tasa_dolar || 1),
        euro: Number(cierre.tasa_euro || 1),
        bolivar: Number(cierre.tasa_bolivar || 1)
      },
      efectivoInicial: FormatUtils.float(cierre.efectivo_inicial_total || 0),
      efectivoInicialDetalle: {
        Bs: FormatUtils.float(cierre.efectivo_inicial_bs || 0),
        USD: FormatUtils.float(cierre.efectivo_inicial_usd || 0),
        EUR: FormatUtils.float(cierre.efectivo_inicial_eur || 0)
      },
      observaciones: cierre.observaciones_apertura,
      notasCierre: cierre.notas_cierre,
      motivoAnulacion: cierre.motivo_anulacion,
      estadoConciliacion: String(cierre.estado_conciliacion || '').trim() || (Math.abs(Number(cierre.diferencia_total || 0)) > 0.01 ? 'diferencia' : 'cuadrado'),
      efectivoFinalTeorico: FormatUtils.float(cierre.efectivo_teorico_final || 0),
      efectivoFinalReal: FormatUtils.float(cierre.efectivo_real_final || 0),
      diferencia: FormatUtils.float(cierre.diferencia_total || 0),
      totales: totalesOverride || {
        ingresos: FormatUtils.float(cierre.total_ingresos || 0),
        egresos: FormatUtils.float(cierre.total_egresos || 0),
        neto: FormatUtils.float(cierre.total_neto || 0),
        ventasContado: FormatUtils.float(cierre.ventas_contado || 0),
        ventasCredito: FormatUtils.float(cierre.ventas_credito || 0),
        ventasPendientes: FormatUtils.float(cierre.ventas_pendientes || 0)
      }
    };

    if (incluirDetalle) {
      output.detalleCierreReal = {
        efectivo: {
          usd: FormatUtils.float(cierre.efectivo_real_usd || 0),
          eur: FormatUtils.float(cierre.efectivo_real_eur || 0),
          ves: FormatUtils.float(cierre.efectivo_real_ves || 0)
        },
        ...this.agruparConciliaciones(conciliaciones),
        notasCierre: cierre.notas_cierre || '',
        fechaCierre: cierre.fecha_cierre,
        usuarioCierre: usuarioCierreNombre,
        diferenciaTotal: FormatUtils.float(cierre.diferencia_total || 0),
        estadoConciliacion: output.estadoConciliacion
      };
      output.opciones = {
        imprimirResumen: !!cierre.imprimir_resumen,
        enviarEmail: !!cierre.enviar_email
      };
      output.transaccionesManuales = [];

      for (const transaccion of transaccionesManuales) {
        const nombreUsuario = await this.obtenerNombreUsuario(transaccion.usuario_cedula);
        output.transaccionesManuales.push(this.mapTransaccionManualOutput(transaccion, nombreUsuario));
      }
    }

    return output;
  },

  async obtenerResumenDiario(fecha, sedeId) {
    const monedaPrincipal = await this.obtenerMonedaPrincipal(sedeId);
    const tasasActualesPorId = await this.obtenerTasasActualesPorId();
    const tasasCambio = this.construirTasasCambio(monedaPrincipal, tasasActualesPorId);
    const { ventas, ventasFormateadas } = await this.obtenerVentasDelDia(fecha, sedeId);
    const abonosDelDia = await this.obtenerAbonosDelDia(fecha, sedeId);
    const cierre = await this.obtenerCierrePorFechaSede(fecha, sedeId);
    const bloqueoOperativo = await this.obtenerBloqueoCierrePendienteAnterior(fecha, sedeId, 'operar');

    let cierreOutput = null;
    let transaccionesManualesOutput = [];

    if (cierre) {
      const transaccionesManuales = await this.obtenerTransaccionesManuales(cierre.id);
      const conciliaciones = await this.obtenerConciliaciones(cierre.id);
      const resumenOperativo = this.calcularResumenOperativo(ventas, transaccionesManuales, monedaPrincipal);

      cierreOutput = await this.mapCierreOutput(cierre, {
        incluirDetalle: true,
        totalesOverride: resumenOperativo,
        transaccionesManuales,
        conciliaciones
      });

      for (const transaccion of transaccionesManuales) {
        const nombreUsuario = await this.obtenerNombreUsuario(transaccion.usuario_cedula);
        transaccionesManualesOutput.push(this.mapTransaccionManualOutput(transaccion, nombreUsuario));
      }
    }

    return {
      message: 'ok',
      fecha: this.formatearFecha(fecha),
      sede: sedeId,
      monedaPrincipal: monedaPrincipal === 'bolivar' ? 'VES' : monedaPrincipal.toUpperCase(),
      tasasCambio,
      ventas: ventasFormateadas,
      abonosDelDia,
      cierreExistente: cierreOutput,
      bloqueoOperativo,
      transaccionesManuales: transaccionesManualesOutput,
      estadisticas: this.calcularEstadisticasVentas(ventasFormateadas)
    };
  },

  async obtenerResumenPublicoPorToken(token) {
    const { sede, fecha } = this.decodificarTokenPublico(token);
    const fechaNormalizada = this.normalizarFecha(fecha);
    const resumen = await this.obtenerResumenDiario(fechaNormalizada, sede);
    const cierre = resumen?.cierreExistente;

    if (!cierre) {
      throw { message: 'No existe un cierre disponible para la fecha indicada.' };
    }

    if (!['cerrado', 'revisado'].includes(String(cierre.estado || '').trim().toLowerCase())) {
      throw { message: 'El cierre indicado aun no esta disponible para consulta publica.' };
    }

    return resumen;
  },

  async abrirCaja(payload, req) {
    const fecha = this.normalizarFecha(payload.fecha);
    const sedeId = await this.resolverSedeOperacion(req, payload.sede, false);
    const cierreExistente = await this.obtenerCierrePorFechaSede(fecha, sedeId);

    if (!this.esMismaFechaOperativa(fecha, new Date())) {
      throw { message: 'Solo se puede iniciar la caja del dia actual.' };
    }

    if (cierreExistente) {
      throw { message: `Ya existe un cierre de caja para la fecha ${this.formatearFecha(fecha)} en la sede ${sedeId}.` };
    }

    await this.validarSinCierresPendientesAnteriores(fecha, sedeId, 'abrir la caja');

    const monedaPrincipal = await this.obtenerMonedaPrincipal(sedeId);
    const tasasCambio = payload.tasasCambio || this.construirTasasCambio(monedaPrincipal, await this.obtenerTasasActualesPorId());
    const detalle = payload.efectivoInicial?.detalle || {};
    const totalSistema = FormatUtils.float(payload.efectivoInicial?.totalSistema || 0);
    const cierreId = this.construirCierreId(fecha, sedeId);

    const cierre = await CierreCaja.create({
      id: cierreId,
      fecha: this.formatearFecha(fecha),
      sede: sedeId,
      estado: 'abierto',
      moneda_principal: monedaPrincipal === 'VES' ? 'bolivar' : this.normalizarCodigoMoneda(monedaPrincipal),
      tasa_dolar: Number(tasasCambio.dolar || 1),
      tasa_euro: Number(tasasCambio.euro || 1),
      tasa_bolivar: Number(tasasCambio.bolivar || 1),
      usuario_apertura_cedula: req.user.cedula,
      fecha_apertura: new Date(),
      observaciones_apertura: String(payload.observaciones || '').trim() || null,
      efectivo_inicial_total: totalSistema,
      efectivo_inicial_bs: FormatUtils.float(detalle.Bs || 0),
      efectivo_inicial_usd: FormatUtils.float(detalle.USD || 0),
      efectivo_inicial_eur: FormatUtils.float(detalle.EUR || 0),
      created_by: req.user.cedula,
      updated_by: req.user.cedula
    });

    return {
      message: 'ok',
      cierre: {
        id: cierre.id,
        estado: cierre.estado,
        fecha: new Date(`${cierre.fecha}T00:00:00.000Z`),
        fechaApertura: cierre.fecha_apertura,
        sede: cierre.sede,
        usuarioApertura: req.user.nombre,
        monedaPrincipal: cierre.moneda_principal === 'bolivar' ? 'VES' : cierre.moneda_principal.toUpperCase()
      }
    };
  },

  async crearTransaccionManual(cierreId, payload, req) {
    const cierre = await this.obtenerCierrePorId(cierreId);
    if (!cierre) {
      throw { message: 'No existe el cierre de caja indicado.' };
    }

    if (cierre.sede !== req.sede.id) {
      throw { message: 'No tienes permisos para registrar transacciones en este cierre.' };
    }

    if (cierre.estado === 'cerrado') {
      throw { message: 'La caja ya fue cerrada y no admite nuevas transacciones manuales.' };
    }

    const transaccion = await CierreCajaTransaccionManual.create({
      id: `TRX-${Date.now()}`,
      cierre_id: cierre.id,
      fecha: payload.fecha ? new Date(payload.fecha) : new Date(),
      tipo: String(payload.tipo || '').trim(),
      descripcion: String(payload.descripcion || '').trim(),
      monto: FormatUtils.float(payload.monto || 0),
      moneda: String(payload.moneda || cierre.moneda_principal || 'USD').trim(),
      monto_sistema: FormatUtils.float(payload.montoSistema || payload.monto || 0),
      metodo_pago: String(payload.metodoPago || 'efectivo').trim(),
      categoria: String(payload.categoria || '').trim() || null,
      observaciones: String(payload.observaciones || '').trim() || null,
      comprobante: String(payload.comprobante || '').trim() || null,
      usuario_cedula: req.user.cedula,
      estado: 'confirmado',
      origen: 'manual'
    });

    return {
      message: 'ok',
      transaccion: this.mapTransaccionManualOutput(transaccion, req.user.nombre)
    };
  },

  async actualizarTransaccionManual(transaccionId, payload, req) {
    const transaccion = await CierreCajaTransaccionManual.findOne({ where: { id: transaccionId } });
    if (!transaccion) {
      throw { message: 'No existe la transacción manual indicada.' };
    }

    const cierre = await this.obtenerCierrePorId(transaccion.cierre_id);
    if (!cierre) {
      throw { message: 'No existe el cierre asociado a la transacción.' };
    }

    if (cierre.sede !== req.sede.id) {
      throw { message: 'No tienes permisos para modificar esta transacción.' };
    }

    if (cierre.estado === 'cerrado') {
      throw { message: 'La caja ya fue cerrada y no admite cambios en transacciones manuales.' };
    }

    transaccion.descripcion = String(payload.descripcion || transaccion.descripcion).trim();
    transaccion.monto = payload.monto !== undefined ? FormatUtils.float(payload.monto) : transaccion.monto;
    transaccion.moneda = payload.moneda !== undefined ? String(payload.moneda).trim() : transaccion.moneda;
    transaccion.monto_sistema = payload.montoSistema !== undefined ? FormatUtils.float(payload.montoSistema) : transaccion.monto_sistema;
    transaccion.metodo_pago = payload.metodoPago !== undefined ? String(payload.metodoPago).trim() : transaccion.metodo_pago;
    transaccion.categoria = payload.categoria !== undefined ? String(payload.categoria || '').trim() || null : transaccion.categoria;
    transaccion.observaciones = payload.observaciones !== undefined ? String(payload.observaciones || '').trim() || null : transaccion.observaciones;
    transaccion.comprobante = payload.comprobante !== undefined ? String(payload.comprobante || '').trim() || null : transaccion.comprobante;
    await transaccion.save();

    return {
      message: 'ok',
      transaccion: this.mapTransaccionManualOutput(transaccion, await this.obtenerNombreUsuario(transaccion.usuario_cedula))
    };
  },

  async cerrarCaja(payload, req) {
    const cierre = await this.obtenerCierrePorId(payload.cierreId);
    if (!cierre) {
      throw { message: 'No existe el cierre de caja indicado.' };
    }

    if (cierre.sede !== req.sede.id) {
      throw { message: 'No tienes permisos para cerrar esta caja.' };
    }

    if (!['abierto', 'revisado'].includes(cierre.estado)) {
      throw { message: 'Solo se pueden cerrar cajas con estado abierto o revisado.' };
    }

    const fecha = this.normalizarFecha(payload.fecha || cierre.fecha);
    const { ventas } = await this.obtenerVentasDelDia(fecha, cierre.sede);
    const transaccionesManuales = await this.obtenerTransaccionesManuales(cierre.id);
    const resumenOperativo = this.calcularResumenOperativo(ventas, transaccionesManuales, cierre.moneda_principal);
    const detalleReal = payload.efectivo?.detalleReal || {};
    const conciliacion = payload.conciliacion || {};

    const t = await sequelize.transaction();
    try {
      cierre.estado = 'cerrado';
      cierre.usuario_cierre_cedula = req.user.cedula;
      cierre.fecha_cierre = new Date();
      cierre.notas_cierre = String(payload.notasCierre || '').trim() || null;
      cierre.total_ingresos = resumenOperativo.ingresos;
      cierre.total_egresos = resumenOperativo.egresos;
      cierre.total_neto = resumenOperativo.neto;
      cierre.ventas_contado = resumenOperativo.ventasContado;
      cierre.ventas_credito = resumenOperativo.ventasCredito;
      cierre.ventas_pendientes = resumenOperativo.ventasPendientes;
      cierre.efectivo_teorico_final = FormatUtils.float(payload.efectivo?.teoricoFinal || 0);
      cierre.efectivo_real_final = FormatUtils.float(payload.efectivo?.realFinal || 0);
      cierre.efectivo_real_usd = FormatUtils.float(detalleReal.usd || 0);
      cierre.efectivo_real_eur = FormatUtils.float(detalleReal.eur || 0);
      cierre.efectivo_real_ves = FormatUtils.float(detalleReal.ves || 0);
      cierre.diferencia_total = FormatUtils.float(payload.diferenciaTotal ?? payload.efectivo?.diferencia ?? 0);
      cierre.estado_conciliacion = String(payload.estadoConciliacion || '').trim() || (Math.abs(Number(payload.diferenciaTotal || 0)) > 0.01 ? 'diferencia' : 'cuadrado');
      cierre.imprimir_resumen = payload.opciones?.imprimirResumen !== false;
      cierre.enviar_email = payload.opciones?.enviarEmail === true;
      cierre.updated_by = req.user.cedula;
      await cierre.save({ transaction: t });

      await CierreCajaConciliacion.destroy({ where: { cierre_id: cierre.id }, transaction: t });

      const crearItemsConciliacion = async (metodo, items) => {
        if (!Array.isArray(items)) {
          return;
        }

        for (const item of items) {
          await CierreCajaConciliacion.create({
            cierre_id: cierre.id,
            metodo,
            banco: String(item.banco || '').trim() || null,
            banco_codigo: String(item.bancoCodigo || '').trim() || null,
            destino_key: String(item.destinoKey || '').trim() || null,
            destino_label: String(item.destinoLabel || '').trim() || null,
            monto_sistema: FormatUtils.float(item.montoSistema || 0),
            monto_real: FormatUtils.float(item.montoReal || 0),
            diferencia: FormatUtils.float(item.diferencia || 0),
            cantidad_sistema: item.cantidadSistema !== undefined ? parseInt(item.cantidadSistema, 10) || 0 : null,
            cantidad_real: item.cantidadReal !== undefined ? parseInt(item.cantidadReal, 10) || 0 : null
          }, { transaction: t });
        }
      };

      await crearItemsConciliacion('punto', conciliacion.punto);
      await crearItemsConciliacion('transferencia', conciliacion.transferencia);
      await crearItemsConciliacion('pagomovil', conciliacion.pagomovil);
      await crearItemsConciliacion('zelle', conciliacion.zelle);

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    let resultadoCorreo = { enviado: false, motivo: 'no-intentado' };

    try {
      resultadoCorreo = await this.enviarCorreoCierreCaja({ cierre, payload, req });
    } catch (error) {
      console.error('No se pudo enviar el correo del cierre de caja:', error);
      resultadoCorreo = {
        enviado: false,
        motivo: 'error-envio',
        detalle: error?.message || error?.toString?.() || 'Error desconocido'
      };
    }

    return {
      message: 'ok',
      cierre: {
        id: cierre.id,
        estado: cierre.estado,
        fechaCierre: cierre.fecha_cierre,
        usuarioCierre: req.user.nombre,
        diferencia: FormatUtils.float(cierre.diferencia_total || 0),
        notasCierre: cierre.notas_cierre
      },
      correo: resultadoCorreo
    };
  },

  async obtenerHistorial(fechaInicio, fechaFin, req) {
    const inicio = this.normalizarFecha(fechaInicio);
    const fin = this.normalizarFecha(fechaFin);
    const sedeId = await this.resolverSedeOperacion(req, req.query.sede, true);

    const cierres = await CierreCaja.findAll({
      where: {
        sede: sedeId,
        fecha: {
          [Op.between]: [this.formatearFecha(inicio), this.formatearFecha(fin)]
        }
      },
      order: [['fecha', 'DESC'], ['fecha_apertura', 'DESC']]
    });

    const output = [];
    for (const cierre of cierres) {
      const transaccionesManuales = await this.obtenerTransaccionesManuales(cierre.id);
      const conciliaciones = await this.obtenerConciliaciones(cierre.id);

      output.push(await this.mapCierreOutput(cierre, {
        incluirDetalle: true,
        transaccionesManuales,
        conciliaciones
      }));
    }

    return {
      message: 'ok',
      cierres: output
    };
  },

  async anularCierre(cierreId, motivo, req) {
    const cierre = await this.obtenerCierrePorId(cierreId);
    if (!cierre) {
      throw { message: 'No existe el cierre de caja indicado.' };
    }

    if (cierre.sede !== req.sede.id) {
      throw { message: 'No tienes permisos para anular este cierre.' };
    }

    cierre.estado = 'revisado';
    cierre.motivo_anulacion = String(motivo || '').trim();
    cierre.fecha_revision = new Date();
    cierre.updated_by = req.user.cedula;
    await cierre.save();

    return {
      message: 'ok',
      cierre: {
        id: cierre.id,
        estado: cierre.estado,
        motivoAnulacion: cierre.motivo_anulacion,
        fechaRevision: cierre.fecha_revision
      }
    };
  }
};

module.exports = CierreCajaService;