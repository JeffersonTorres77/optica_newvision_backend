const Configuracion = require("../models/Configuracion");
const { v4: uuidv4 } = require('uuid');
const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const Tasa = require("../models/Tasa");
const HistorialMedico = require("../models/HistorialMedico");
const Venta = require("../models/Venta");
const Producto = require("../models/Producto");
const VentaProducto = require("../models/VentaProducto");
const VentaPago = require("../models/VentaPago");
const VentaPagoAgrupado = require("../models/VentaPagoAgrupado");
const VentaCasheaCuota = require("../models/VentaCasheaCuota");
const VentaCashea = require("../models/VentaCashea");
const VerificationUtils = require("../utils/VerificationUtils");
const FormatUtils = require("../utils/FormatUtils");
const Cliente = require("../models/Cliente");

const VentaService = {
    async get_numero_control(sede_id) {
        const objConf = await Configuracion.findOne({ where: { clave: "numero_control", sede: sede_id } });
        return parseInt(objConf.valor);
    },

    async generate_venta_key() {
        let output = null;
        do {
            const venta_key = uuidv4();
            const count = await Venta.count({ where: { venta_key: venta_key } });
            if (count < 1) {
                output = venta_key;
            }
        } while (output === null);
        return output;
    },

    async get_tasa(tasa_id) {
        const objTasa = await Tasa.findOne({ where: { id: tasa_id } });
        if (!objTasa) {
            throw { message: `La moneda enviada no existe: ${tasa_id}` };
        }
        return objTasa;
    },

    async get_paciente(sede_id, paciente_cedula) {
        const objPaciente = await Paciente.findOne({ where: { sede_id: sede_id, cedula: paciente_cedula } });
        if (!objPaciente) {
            return null;
        }
        return objPaciente;
    },

    async get_usuario(usuario_id) {
        const objUsuario = await Usuario.findOne({ where: { id: usuario_id } });
        if (!objUsuario) {
            throw { message: `El asesor enviado no existe: ${usuario_id}` };
        }
        return objUsuario;
    },

    validate_forma_pago(forma_pago) {
        if (['cashea', 'contado', 'abono'].includes(forma_pago) === false) {
            throw { message: `La forma de pago es invalida: ${forma_pago}` };
        }
    },

    formatear_fecha(fecha_par) {
        const fecha = new Date(fecha_par);

        const opciones = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "UTC" // importante para mantener la hora original
        };

        const formato = new Intl.DateTimeFormat("sv-SE", opciones).format(fecha).replace(" ", " ");
        return formato;
    },

    async get_historia_medica(historia_medica_id) {
        const objHistorial = await HistorialMedico.findOne({ where: { id: historia_medica_id } });
        if (!objHistorial) {
            throw { message: `El ID de la historia medica es invalida: ${historia_medica_id}` };
        }
        return objHistorial;
    },

    async add_producto_db(productos_array) {
        const output = [];
        for (let producto of productos_array) {
            const objProducto = await Producto.findOne({ where: { id: producto.productoId } });
            if (!objProducto) {
                throw { message: `El ID del producto es invalido: ${producto.productoId}` };
            }
            output.push({ ...producto, objeto: objProducto });
        }
        return output;
    },

    async prepare_productos_array(productos_array, objTasaVenta) {
        const output = [];
        for (let producto of productos_array) {
            const objTasaProducto = await Tasa.findOne({ where: { id: producto.objeto.moneda } });

            const total_moneda_producto = (producto.objeto.precio_con_iva * producto.cantidad);
            const precio_unitario = (producto.objeto.precio_con_iva * objTasaProducto.valor) / objTasaVenta.valor;
            const total = (precio_unitario * producto.cantidad);
            const precio_unitario_sin_iva = (producto.objeto.aplica_iva) ? ((100 / 116) * precio_unitario) : (precio_unitario);

            output.push({
                producto_id: producto.productoId,
                cantidad: producto.cantidad,
                moneda_producto: objTasaProducto.id,
                tasa_moneda_producto: FormatUtils.float(objTasaProducto.valor),
                total_moneda_producto: FormatUtils.float(total_moneda_producto),
                precio_unitario_sin_iva: FormatUtils.float(precio_unitario_sin_iva),
                tiene_iva: producto.objeto.aplica_iva,
                precio_unitario: FormatUtils.float(precio_unitario),
                total: FormatUtils.float(total),
                objeto: producto.objeto
            });
        }
        return output;
    },

    async prepare_metodos_de_pago_array(metodosPago, objTasaVenta) {
        const output = [];
        for (let metodoDePago of metodosPago) {
            const objTasaPago = await Tasa.findOne({ where: { id: metodoDePago.moneda } });

            output.push({
                tipo: metodoDePago.tipo,
                monto: FormatUtils.float(metodoDePago.monto),
                moneda_id: objTasaPago.id,
                tasa_moneda: FormatUtils.float(objTasaPago.valor),
                monto_moneda_base: FormatUtils.float((metodoDePago.monto * objTasaPago.valor) / objTasaVenta.valor),
                referencia: metodoDePago.referencia,
                bancoCodigo: metodoDePago.bancoCodigo,
                bancoNombre: metodoDePago.bancoNombre,
            });
        }
        return output;
    },

    VerificarPagoCompleto(total, array_pagos) {
        let total_pagos = 0;

        for (let objPago of array_pagos) {
            total_pagos += objPago.monto_moneda_base;
        }

        return (total_pagos >= total);
    },

    async guardar_venta(t, venta_completa) {
        await Venta.create({
            venta_key: venta_completa.venta_key,
            numero_control: venta_completa.numero_control,
            sede: venta_completa.sede,
            paciente_key: venta_completa.paciente_key,
            cliente_tipo: venta_completa.cliente_tipo,
            cliente_informacion_persona: venta_completa.cliente_informacion_persona,
            cliente_informacion_nombre: venta_completa.cliente_informacion_nombre,
            cliente_informacion_cedula: venta_completa.cliente_informacion_cedula,
            cliente_informacion_telefono: venta_completa.cliente_informacion_telefono,
            cliente_informacion_email: venta_completa.cliente_informacion_email,
            moneda: venta_completa.moneda,
            tasa_moneda: venta_completa.tasa_moneda,
            forma_pago: venta_completa.forma_pago,
            iva_porcentaje: venta_completa.iva_porcentaje,
            descuento: venta_completa.descuento,
            subtotal: venta_completa.subtotal,
            iva: venta_completa.iva,
            total: venta_completa.total,
            observaciones: venta_completa.observaciones,
            fecha: venta_completa.fecha,
            pago_completo: venta_completa.pago_completo,
            created_by: venta_completa.created_by,
            asesor_id: venta_completa.asesor_id,
            estatus_venta: venta_completa.estatus_venta,
            estatus_pago: venta_completa.estatus_pago,
            motivo_cancelacion: null
        }, { transaction: t });

        for (let producto of venta_completa.productos) {
            await VentaProducto.create({
                venta_key: venta_completa.venta_key,
                producto_id: producto.producto_id,
                cantidad: producto.cantidad,
                precio_unitario_sin_iva: producto.precio_unitario_sin_iva,
                tiene_iva: producto.tiene_iva,
                precio_unitario: producto.precio_unitario,
                total: producto.total,
                moneda_producto: producto.moneda_producto,
                tasa_moneda_producto: producto.tasa_moneda_producto,
                total_moneda_producto: producto.total_moneda_producto
            }, { transaction: t });
        }

        let monto_abonado = 0;
        for (let pago of venta_completa.pagos) {
            monto_abonado += pago.monto_moneda_base;

            await VentaPago.create({
                venta_key: venta_completa.venta_key,
                numero_pago: 1,
                tipo: pago.tipo,
                monto: pago.monto,
                moneda_id: pago.moneda_id,
                tasa_moneda: pago.tasa_moneda,
                monto_moneda_base: pago.monto_moneda_base,
                referencia: pago.referencia,
                bancoCodigo: pago.bancoCodigo,
                bancoNombre: pago.bancoNombre,
                created_by: venta_completa.created_by
            }, { transaction: t });
        }

        await VentaPagoAgrupado.create({
            venta_key: venta_completa.venta_key,
            numero_pago: 1,
            monto_abonado: monto_abonado,
            observaciones: null,
            created_by: venta_completa.created_by
        }, { transaction: t });

        if (venta_completa.forma_pago === 'cashea') {
            await VentaCashea.create({
                venta_key: venta_completa.venta_key,
                nivel_cashea: venta_completa.cashea.nivel_cashea,
                monto_inicial: venta_completa.cashea.monto_inicial,
                cantidad_cuotas: venta_completa.cashea.cantidad_cuotas,
                monto_por_cuota: venta_completa.cashea.monto_por_cuota,
                total_adelantado: venta_completa.cashea.total_adelantado
            }, { transaction: t });

            for (let cuota of venta_completa.cashea_cuotas) {
                await VentaCasheaCuota.create({
                    venta_key: venta_completa.venta_key,
                    numero: cuota.numero,
                    monto: cuota.monto,
                    fecha_vencimiento: cuota.fecha_vencimiento,
                    pagada: cuota.pagada,
                    seleccionada: cuota.seleccionada
                }, { transaction: t });
            }
        }
    },

    async guardar_cliente(t, objCliente, sede_id) {
        let cliente = await Cliente.findOne({
            where: { cedula: objCliente.informacion.cedula }
        });

        if (cliente) {
            cliente.cedula = objCliente.informacion.cedula;
            cliente.nombre = objCliente.informacion.nombreCompleto;
            cliente.telefono = objCliente.informacion.telefono;
            cliente.email = objCliente.informacion.email;
            await cliente.save({ transaction: t });
        } else {
            await Cliente.create({
                sede_id: sede_id,
                cedula: objCliente.informacion.cedula,
                nombre: objCliente.informacion.nombreCompleto,
                telefono: objCliente.informacion.telefono,
                email: objCliente.informacion.email
            }, { transaction: t });
        }
    },

    async descontar_inventario(t, productos) {
        for (const producto of productos) {
            producto.objeto.stock -= producto.cantidad;
            await producto.objeto.save({ transaction: t });
        }
    },

    async actualizar_numero_control(t, numero_control, sede_id) {
        await Configuracion.update(
            { valor: numero_control.toString() },
            {
                where: { sede: sede_id, clave: "numero_control" },
                transaction: t
            }
        );
    },

    async anular_descontada_inventario(t, array_productos) {
        for (let producto of array_productos) {
            const objProducto = await Producto.findOne({ where: { id: producto.producto_id } });
            if (!objProducto) {
                throw { message: `El ID del producto es invalido: ${producto.producto_id}` };
            }

            objProducto.stock += producto.cantidad;
            await objProducto.save({ transaction: t });
        }
    },

    extrear_numero_de_numero_control(numero_control) {
        const match = numero_control.match(/[VR]\-([0-9]{3,})/);
        return match ? parseInt(match[1], 10) : null;
    },

    async BuscarTotalVenta(estatus_venta = false) {
        if (estatus_venta) {
            return await Venta.count({ where: { estatus_venta: estatus_venta } });
        } else {
            return await Venta.count();
        }
    },

    async formatear_venta_output(objVenta) {
        const metodosPagos = [];
        let total_pagado = 0;
        for (let pagoAgrupado of objVenta.array_pagos_agrupados) {
            const pagos = [];
            for (let pago of objVenta.array_pagos) {
                if (pago.numero_pago !== pagoAgrupado.numero_pago) {
                    continue;
                }

                pagos.push({
                    tipo: pago.tipo,
                    monto: pago.monto,
                    moneda_id: pago.moneda_id,
                    tasa_moneda: pago.tasa_moneda,
                    monto_moneda_base: pago.monto_moneda_base,
                    referencia: pago.referencia,
                    bancoCodigo: pago.bancoCodigo,
                    bancoNombre: pago.bancoNombre,
                    fechaRegistro: pago.created_at
                });
            }

            total_pagado += pagoAgrupado.monto_abonado;
            metodosPagos.push({
                numero_pago: pagoAgrupado.numero_pago,
                montoAbonado: pagoAgrupado.monto_abonado,
                metodosPago: pagos,
                observaciones: pagoAgrupado.observaciones
            });
        }

        const productos = [];
        for (let producto of objVenta.array_productos) {
            productos.push({
                cantidad: producto.cantidad,
                precio_unitario_sin_iva: producto.precio_unitario_sin_iva,
                tiene_iva: producto.tiene_iva,
                precio_unitario: producto.precio_unitario,
                total: producto.total,
                datos: {
                    id: producto.datos_producto.id,
                    nombre: producto.datos_producto.nombre,
                    marca: producto.datos_producto.marca,
                    color: producto.datos_producto.color,
                    codigo: producto.datos_producto.codigo,
                    material: producto.datos_producto.material,
                    categoria: producto.datos_producto.categoria,
                    modelo: producto.datos_producto.modelo
                }
            });
        }

        let ultima_historia_medica = null;
        if (objVenta.cliente_tipo == 'paciente') {
            const objPaciente = await Paciente.findOne({ where: { sede_id: objVenta.sede, cedula: objVenta.cliente_informacion_cedula } });
            if (objPaciente) {
                ultima_historia_medica = await HistorialMedico.findOne({ where: { paciente_id: objPaciente.id }, order: [['created_at', 'DESC']] });
            }
        }

        const formaPago = {
            tipo: objVenta.forma_pago,
            montoTotal: objVenta.total,
            cuotasAdelantadas: 0,
            montoAdelantado: 0,
            deudaPendiente: 0,
            nivel: null,
            montoInicial: 0,
            cantidadCuotas: 0,
            montoPorCuota: 0,
            totalPagadoAhora: 0,
            cuotas: []
        };

        if (objVenta.forma_pago == "cashea") {
            let cuotasAdelantadas = 0;
            let montoAdelantado = 0;
            for (let cuota of objVenta.cuotas_cashea) {
                if (cuota.seleccionada) {
                    cuotasAdelantadas += 1;
                    montoAdelantado += cuota.monto;
                }
            }

            formaPago.cuotasAdelantadas = cuotasAdelantadas;
            formaPago.montoAdelantado = FormatUtils.float(montoAdelantado);
            formaPago.deudaPendiente = FormatUtils.float(objVenta.total - montoAdelantado - objVenta.datos_cashea.monto_inicial);

            formaPago.nivel = objVenta.datos_cashea.nivel_cashea;
            formaPago.montoInicial = objVenta.datos_cashea.monto_inicial;
            formaPago.cantidadCuotas = objVenta.datos_cashea.cantidad_cuotas;
            formaPago.montoPorCuota = objVenta.datos_cashea.monto_por_cuota;
            formaPago.totalPagadoAhora = objVenta.datos_cashea.total_adelantado;

            formaPago.cuotas = objVenta.cuotas_cashea;
        }
        else if (objVenta.forma_pago == "abono") {
            let monto_inicial = 0;
            let monto_pagado = 0;
            for (const pago of objVenta.array_pagos) {
                if (pago.created_at.toISOString() == objVenta.created_at.toISOString()) {
                    monto_inicial += pago.monto_moneda_base;
                }
                monto_pagado += pago.monto_moneda_base;
            }

            formaPago.montoInicial = FormatUtils.float(monto_inicial);
            formaPago.totalPagadoAhora = FormatUtils.float(monto_pagado);
            formaPago.deudaPendiente = FormatUtils.float(formaPago.montoTotal - formaPago.totalPagadoAhora);
        }

        return {
            venta: {
                key: objVenta.venta_key,
                numero_venta: "V-" + String(objVenta.numero_control).padStart(6, "0"),
                numero_recibo: "R-" + String(objVenta.numero_control).padStart(6, "0"),
                fecha: objVenta.fecha,
                estatus_venta: objVenta.estatus_venta,
                estatus_pago: objVenta.estatus_pago,
                formaPago: objVenta.forma_pago,
                moneda: objVenta.moneda,
                observaciones: objVenta.observaciones,
                impuesto: objVenta.iva_porcentaje,
                motivo_cancelacion: objVenta.motivo_cancelacion
            },
            totales: {
                descuento: objVenta.descuento,
                subtotal: objVenta.subtotal,
                iva: objVenta.iva,
                total: objVenta.total,
                totalPagado: FormatUtils.float(total_pagado),
            },
            cliente: {
                ultima_historia_medica: ultima_historia_medica,
                tipo: objVenta.cliente_tipo, //(Cuando es tipo paciente, debes buscar por cedula la ultima historia medica y retornarla en el api del get)
                informacion: {
                    tipoPersona: objVenta.cliente_informacion_persona,
                    nombreCompleto: objVenta.cliente_informacion_nombre,
                    cedula: objVenta.cliente_informacion_cedula,
                    telefono: objVenta.cliente_informacion_telefono,
                    email: objVenta.cliente_informacion_email
                }
            },
            asesor: {
                id: objVenta.asesor_user.id,
                cedula: objVenta.asesor_user.cedula,
                nombre: objVenta.asesor_user.nombre
            },
            productos: productos,
            metodosPago: metodosPagos,
            formaPago: formaPago,
            auditoria: {
                usuarioCreacion: {
                    id: objVenta.asesor_user.id,
                    cedula: objVenta.asesor_user.cedula,
                    nombre: objVenta.asesor_user.nombre
                },
                fechaCreacion: objVenta.created_at,
                fechaModificacion: objVenta.updated_at
            },
            ultima_historia_medica: ultima_historia_medica
        };
    },
};

module.exports = VentaService;