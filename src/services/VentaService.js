const Configuracion = require("../models/Configuracion");
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
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
const Empresa = require("../models/Empresa");
const VentaConsulta = require("../models/VentaConsulta");
const ConfiguracionService = require("./ConfiguracionService");

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

    async get_tasas_actuales() {
        return await Tasa.findAll({ where: { id: { [Op.ne]: 'bolivar' } }, attributes: ['id', 'valor'] });
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

    async get_usuario_by_id(usuario_id) {
        const objUsuario = await Usuario.findOne({ where: { id: usuario_id } });
        if (objUsuario) {
            return objUsuario;
        } else {
            return false;
        }
    },

    async get_usuario_by_cedula(usuario_cedula) {
        const objUsuario = await Usuario.findOne({ where: { cedula: usuario_cedula } });
        if (objUsuario) {
            return objUsuario;
        } else {
            return false;
        }
    },

    async get_empresa(cliente) {
        if (!cliente.informacionEmpresa || !cliente.informacionEmpresa.referidoEmpresa) {
            return null;
        }

        const rif = cliente.informacionEmpresa.empresaRif;
        const objEmpresa = await Empresa.findOne({ where: { rif: rif } });
        if (!objEmpresa) {
            return null;
        }
        return objEmpresa;
    },

    validate_forma_pago(forma_pago) {
        if (['cashea', 'contado', 'abono', 'de_contado-pendiente'].includes(forma_pago) === false) {
            throw { message: `La forma de pago es invalida: ${forma_pago}` };
        }
    },

    async validar_historia_medica(historia_id, t = null, venta_key = null, pago_completo = false) {
        if (!historia_id) {
            throw { message: "El ID de la historia médica es obligatorio para este tipo de venta." };
        }
        const objHistorial = await HistorialMedico.findOne({ where: { id: historia_id }, transaction: t });
        if (!objHistorial) {
            throw { message: `La historia médica ID: ${historia_id} no existe.` };
        }

        if (venta_key) {
            objHistorial.venta_key = venta_key;
        }

        // Sincronizar pago_pendiente con el estado de la venta
        // pago_pendiente = 1 (true) si la venta NO está completa
        objHistorial.pago_pendiente = !pago_completo;

        await objHistorial.save({ transaction: t });
        return objHistorial;
    },

    async sincronizar_costos_consulta(t, pagoMedico, pagoOptica, sede_id) {
        const costoTotal = pagoMedico + pagoOptica;

        const syncField = async (clave, valor) => {
            const config = await Configuracion.findOne({ where: { sede: sede_id, clave: clave } });
            if (config) {
                if (parseFloat(config.valor) !== valor) {
                    config.valor = valor.toString();
                    await config.save({ transaction: t });
                }
            } else {
                await Configuracion.create({
                    sede: sede_id,
                    clave: clave,
                    valor: valor.toString()
                }, { transaction: t });
            }
        };

        await syncField("costo_total_consulta", costoTotal);
        await syncField("costo_medico_consulta", pagoMedico);
    },

    async add_producto_db(productos_array) {
        const output = [];
        for (let producto of productos_array) {
            const id = producto.id || producto.productoId;
            const objProducto = await Producto.findOne({ where: { id: id } });
            if (!objProducto) {
                throw { message: `El ID del producto es invalido: ${id}` };
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
                producto_id: producto.id || producto.productoId,
                cantidad: producto.cantidad,
                tipo: producto.tipo || null,
                descripcion: producto.descripcion || null,
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

            const monto_moneda_venta = (metodoDePago.montoEnMonedaVenta !== undefined && metodoDePago.montoEnMonedaVenta !== null)
                ? FormatUtils.float(metodoDePago.montoEnMonedaVenta)
                : FormatUtils.float((metodoDePago.monto * objTasaPago.valor) / objTasaVenta.valor);

            output.push({
                tipo: metodoDePago.tipo,
                monto: FormatUtils.float(metodoDePago.monto),
                moneda_id: objTasaPago.id,
                monto_moneda_base: monto_moneda_venta,
                referencia: metodoDePago.referencia,
                bancoCodigo: metodoDePago.bancoCodigo,
                bancoNombre: metodoDePago.bancoNombre,
                bancoReceptorCodigo: metodoDePago.bancoReceptorCodigo,
                bancoReceptorNombre: metodoDePago.bancoReceptorNombre,
                bancoReceptor: metodoDePago.bancoReceptor,
                notaPago: metodoDePago.notaPago,
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
            empresa_rif: venta_completa.empresa_rif,
            empresa_nombre: venta_completa.empresa_nombre,
            empresa_telefono: venta_completa.empresa_telefono,
            empresa_correo: venta_completa.empresa_correo,
            empresa_direccion: venta_completa.empresa_direccion,
            moneda: venta_completa.moneda,
            tasas_actuales: venta_completa.tasas_actuales,
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
            especialista_cedula: venta_completa.especialista_cedula,
            estatus_venta: venta_completa.estatus_venta,
            estatus_pago: venta_completa.estatus_pago,
            tipo_venta: venta_completa.tipo_venta,
            motivo_cancelacion: null
        }, { transaction: t });

        for (let producto of venta_completa.productos) {
            await VentaProducto.create({
                venta_key: venta_completa.venta_key,
                producto_id: producto.producto_id,
                cantidad: producto.cantidad,
                tipo: producto.tipo,
                descripcion: producto.descripcion,
                precio_unitario_sin_iva: producto.precio_unitario_sin_iva,
                tiene_iva: producto.tiene_iva,
                precio_unitario: producto.precio_unitario,
                total: producto.total,
                moneda_producto: producto.moneda_producto,
                tasa_moneda_producto: producto.tasa_moneda_producto,
                total_moneda_producto: producto.total_moneda_producto
            }, { transaction: t });
        }

        if (venta_completa.tipo_venta === 'solo_consulta' || venta_completa.tipo_venta === 'consulta_productos') {
            if (venta_completa.consulta) {
                await VentaConsulta.create({
                    venta_key: venta_completa.venta_key,
                    historia_id: venta_completa.consulta.historiaId,
                    pago_medico: FormatUtils.float(venta_completa.consulta.pagoMedico),
                    pago_optica: FormatUtils.float(venta_completa.consulta.pagoOptica),
                    es_formula_externa: venta_completa.consulta.esFormulaExterna ? 1 : 0,
                    tipo_especialista: venta_completa.consulta.tipoEspecialista,
                    monto_original: FormatUtils.float(venta_completa.consulta.montoOriginal)
                }, { transaction: t });
            }
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
                monto_moneda_base: pago.monto_moneda_base,
                referencia: pago.referencia,
                bancoCodigo: pago.bancoCodigo,
                bancoNombre: pago.bancoNombre,
                bancoReceptorCodigo: pago.bancoReceptorCodigo,
                bancoReceptorNombre: pago.bancoReceptorNombre,
                bancoReceptor: pago.bancoReceptor,
                notaPago: pago.notaPago,
                created_by: venta_completa.created_by
            }, { transaction: t });
        }

        await VentaPagoAgrupado.create({
            venta_key: venta_completa.venta_key,
            numero_pago: 1,
            monto_abonado: monto_abonado,
            observaciones: null,
            tasas_actuales: venta_completa.tasas_actuales,
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
            where: { cedula: objCliente.cedula }
        });

        if (cliente) {
            cliente.cedula = objCliente.cedula;
            cliente.nombre = objCliente.nombre;
            cliente.telefono = objCliente.telefono;
            cliente.email = objCliente.email;
            await cliente.save({ transaction: t });
        } else {
            await Cliente.create({
                sede_id: sede_id,
                cedula: objCliente.cedula,
                nombre: objCliente.nombre,
                telefono: objCliente.telefono,
                email: objCliente.email
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

    async formatear_venta_output(objVenta) {
        const metodosDePago = [];
        let total_pagado = 0;

        let asesorOutput = { id: objVenta.asesor_id };
        let especialistaOutput = { cedula: objVenta.especialista_cedula };

        if (objVenta.asesor_id) {
            const asesorUsuario = await Usuario.findOne({
                where: { id: objVenta.asesor_id },
                include: [{ association: 'cargo', attributes: ['id', 'nombre'], required: false }],
                attributes: ['id', 'cedula', 'nombre']
            });

            if (asesorUsuario) {
                asesorOutput = {
                    cedula: asesorUsuario.cedula,
                    nombre: asesorUsuario.nombre,
                    cargo: (asesorUsuario.cargo) ? asesorUsuario.cargo.nombre : null
                };
            }
        }

        if (objVenta.especialista_cedula) {
            const especialistaUsuario = await Usuario.findOne({
                where: { cedula: objVenta.especialista_cedula },
                include: [{ association: 'cargo', attributes: ['id', 'nombre'], required: false }],
                attributes: ['id', 'cedula', 'nombre']
            });

            if (especialistaUsuario) {
                especialistaOutput = {
                    cedula: especialistaUsuario.cedula,
                    nombre: especialistaUsuario.nombre,
                    cargo: (especialistaUsuario.cargo) ? especialistaUsuario.cargo.nombre : null
                };
            }
        }

        const moneda_base_id = await ConfiguracionService.get_moneda_base(objVenta.sede);
        const moneda_base_tasa = await Tasa.findOne({ where: { id: moneda_base_id.valor } });
        const arrayPagos = Array.isArray(objVenta.array_pagos) ? objVenta.array_pagos : [];
        const arrayPagosAgrupados = Array.isArray(objVenta.array_pagos_agrupados) ? objVenta.array_pagos_agrupados : [];

        const pagosIniciales = arrayPagos.filter(p => Number(p.numero_pago) === 1);
        const pagosAbonos = arrayPagos.filter(p => Number(p.numero_pago) >= 2);

        const tasaMonedaVenta = (() => {
            if (objVenta.moneda === 'bolivar') return 1;
            const objTasa = (objVenta.tasas_actuales || []).find(t => t.id === objVenta.moneda);
            return objTasa ? objTasa.valor : null;
        })();

        const mapPagoParaAbono = (pago) => {
            let tasaPago = null;
            for (let tasa of (objVenta.tasas_actuales || [])) {
                if (tasa.id === pago.moneda_id) {
                    tasaPago = tasa;
                    break;
                }
            }

            let montoEnMonedaVenta = FormatUtils.float(pago.monto_moneda_base);
            let tasaUsada = null;

            if (tasaMonedaVenta !== null) {
                if (pago.moneda_id === objVenta.moneda) {
                    tasaUsada = null;
                } else if (pago.moneda_id === 'bolivar') {
                    tasaUsada = tasaMonedaVenta;
                } else if (tasaPago) {
                    tasaUsada = tasaPago.valor;
                }
            }

            return {
                tipo: pago.tipo,
                monto: pago.monto,
                moneda: pago.moneda_id,
                montoEnMonedaVenta,
                tasaUsada,
                bancoCodigo: pago.bancoCodigo,
                bancoNombre: pago.bancoNombre,
                bancoReceptorCodigo: pago.bancoReceptorCodigo,
                bancoReceptorNombre: pago.bancoReceptorNombre,
                bancoReceptor: pago.bancoReceptor,
                referencia: pago.referencia,
                notaPago: pago.notaPago,
            };
        };

        for (let pago of pagosIniciales) {
            let tasa_moneda_pago = null;
            for(let tasa of objVenta.tasas_actuales) {
                if(tasa.id === pago.moneda_id) {
                    tasa_moneda_pago = tasa;
                    break;
                }
            }

            if(tasa_moneda_pago === null) {
                metodosDePago.push({
                    tipo: pago.tipo,
                    monto: pago.monto,
                    moneda: pago.moneda_id,

                    montoEnMonedaSistema: null,
                    monedaSistema: moneda_base_tasa.id,
                    montoEnBolivar: null,
                    tasaUasada: null,

                    bancoCodigo: pago.bancoCodigo,
                    bancoNombre: pago.bancoNombre,
                    bancoReceptorCodigo: pago.bancoReceptorCodigo,
                    bancoReceptorNombre: pago.bancoReceptorNombre,
                    bancoReceptor: pago.bancoReceptor,
                    referencia: pago.referencia,
                    notaPago: pago.notaPago,
                });
            } else {
                metodosDePago.push({
                    tipo: pago.tipo,
                    monto: pago.monto,
                    moneda: pago.moneda_id,

                    montoEnMonedaSistema: (pago.moneda_id == moneda_base_tasa.id) ? pago.monto : FormatUtils.float((pago.monto * tasa_moneda_pago.valor) / moneda_base_tasa.valor),
                    monedaSistema: moneda_base_tasa.id,
                    montoEnBolivar: FormatUtils.float(pago.monto * tasa_moneda_pago.valor),
                    tasaUasada: tasa_moneda_pago.valor,

                    bancoCodigo: pago.bancoCodigo,
                    bancoNombre: pago.bancoNombre,
                    bancoReceptorCodigo: pago.bancoReceptorCodigo,
                    bancoReceptorNombre: pago.bancoReceptorNombre,
                    bancoReceptor: pago.bancoReceptor,
                    referencia: pago.referencia,
                    notaPago: pago.notaPago,
                });
            }
            
            total_pagado += pago.monto_moneda_base;
        }

        for (let pago of pagosAbonos) {
            total_pagado += pago.monto_moneda_base;
        }

        const abonosAgrupados = arrayPagosAgrupados
            .filter(a => Number(a.numero_pago) >= 2)
            .sort((a, b) => Number(a.numero_pago) - Number(b.numero_pago));

        const agrupadoInicial = arrayPagosAgrupados.find(a => Number(a.numero_pago) === 1);
        let acumulado = agrupadoInicial
            ? FormatUtils.float(agrupadoInicial.monto_abonado)
            : FormatUtils.float(pagosIniciales.reduce((sum, p) => sum + p.monto_moneda_base, 0));

        const abonos = abonosAgrupados.map((abono, index) => {
            const montoAbonado = FormatUtils.float(abono.monto_abonado || 0);
            acumulado = FormatUtils.float(acumulado + montoAbonado);

            const metodosDePagoAbono = pagosAbonos
                .filter(p => Number(p.numero_pago) === Number(abono.numero_pago))
                .map(mapPagoParaAbono);

            return {
                numero: index + 1,
                fecha: abono.created_at,
                montoAbonado,
                deudaPendiente: FormatUtils.float(objVenta.total - acumulado),
                observaciones: abono.observaciones,
                metodosDePago: metodosDePagoAbono
            };
        });

        const productos = [];
        for (let producto of objVenta.array_productos) {
            productos.push({
                id: producto.datos_producto.id.toString(),
                nombre: producto.datos_producto.nombre,
                codigo: producto.datos_producto.codigo,
                precio: producto.precio_unitario_sin_iva,
                precioConIva: producto.precio_unitario,
                moneda: producto.moneda_producto,
                cantidad: producto.cantidad,
                aplicaIva: producto.tiene_iva === 1,
                stock: producto.datos_producto.stock,
                tipo: producto.tipo,
                descripcion: producto.descripcion
            });
        }

        return {
            key: objVenta.venta_key,
            numero_venta: "V-" + String(objVenta.numero_control).padStart(6, "0"),
            numero_recibo: "R-" + String(objVenta.numero_control).padStart(6, "0"),
            tipoVenta: objVenta.tipo_venta,
            moneda: objVenta.moneda,
            sede: objVenta.sede,
            estatus_venta: objVenta.estatus_venta,
            estatus_pago: objVenta.estatus_pago,
            total: objVenta.total,
            descuento: objVenta.descuento,
            impuesto: objVenta.iva_porcentaje,
            metodosDePago: metodosDePago,
            cliente: {
                tipoCliente: objVenta.cliente_tipo,
                tipoPersona: objVenta.cliente_informacion_persona,
                nombre: objVenta.cliente_informacion_nombre,
                cedula: objVenta.cliente_informacion_cedula,
                telefono: objVenta.cliente_informacion_telefono,
                email: objVenta.cliente_informacion_email,
                informacionEmpresa: {
                    referidoEmpresa: (objVenta.empresa_rif) ? true : false,
                    empresaNombre: objVenta.empresa_nombre,
                    empresaRif: objVenta.empresa_rif,
                    empresaTelefono: objVenta.empresa_telefono,
                    empresaDireccion: objVenta.empresa_direccion,
                    empresaCorreo: objVenta.empresa_correo
                }
            },
            especialista: especialistaOutput,
            ordenTrabajo: !!objVenta.datos_orden_trabajo,
            asesor: asesorOutput,
            auditoria: {
                usuarioCreacion: objVenta.asesor_id, // Usamos el asesor como creador según el ejemplo
                fechaCreacion: objVenta.created_at
            },
            formaPago: {
                tipo: objVenta.forma_pago,
                montoTotal: objVenta.total,
                totalPagado: FormatUtils.float(total_pagado),
                deudaPendiente: FormatUtils.float(objVenta.total - total_pagado),
                abonos
            },
            formaPagoDetalle: {
                tipo: objVenta.forma_pago,
                tasasActuales: objVenta.tasas_actuales,
                montoTotal: objVenta.total,
                totalPagado: FormatUtils.float(total_pagado),
                deuda: FormatUtils.float(objVenta.total - total_pagado),
                abonos,
                ...(objVenta.forma_pago === 'cashea' && objVenta.datos_cashea ? {
                    nivel: objVenta.datos_cashea.nivel_cashea,
                    montoInicial: objVenta.datos_cashea.monto_inicial,
                    cantidadCuotas: objVenta.datos_cashea.cantidad_cuotas,
                    montoPorCuota: objVenta.datos_cashea.monto_por_cuota,
                    totalPagadoAhora: objVenta.datos_cashea.total_pagado_ahora,
                    cuotas: (objVenta.cuotas_cashea || []).map(c => ({
                        numero: c.numero,
                        fecha: c.fecha,
                        monto: c.monto,
                        pagada: c.pagada === 1,
                        seleccionada: c.seleccionada === 1
                    }))
                } : {})
            },
            productos: productos,
            consulta: (objVenta.venta_consulta) ? {
                historiaId: objVenta.venta_consulta.historia_id,
                montoTotal: objVenta.venta_consulta.pago_medico + objVenta.venta_consulta.pago_optica,
                pagoMedico: objVenta.venta_consulta.pago_medico,
                pagoOptica: objVenta.venta_consulta.pago_optica,
                esFormulaExterna: objVenta.venta_consulta.es_formula_externa === 1,
                tipoEspecialista: objVenta.venta_consulta.tipo_especialista,
                tipoVentaConsulta: objVenta.tipo_venta,
                montoOriginal: objVenta.venta_consulta.monto_original
            } : null
        };
    },
};

module.exports = VentaService;