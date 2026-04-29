const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const VerificationUtils = require('../utils/VerificationUtils');
const FormatUtils = require('../utils/FormatUtils');
const ConfiguracionService = require('./ConfiguracionService');
const Presupuesto = require('../models/Presupuesto');
const PresupuestoItem = require('../models/PresupuestoItem');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');

const DEFAULT_IVA_PORCENTAJE = 16;
const ESTADOS_VALIDOS = ['vigente', 'vencido', 'convertido', 'anulado', 'archivado'];
const CRISTAL_CONFIG_START = '[NV_CRISTAL_CONFIG]';
const CRISTAL_CONFIG_END = '[/NV_CRISTAL_CONFIG]';

const PRESUPUESTO_INCLUDE = [
  {
    model: PresupuestoItem,
    as: 'items',
    separate: true,
    order: [['posicion', 'ASC']],
    include: [
      {
        model: Producto,
        as: 'producto',
        required: false,
        paranoid: false,
        attributes: [
          'id',
          'sede_id',
          'codigo',
          'nombre',
          'descripcion',
          'categoria',
          'marca',
          'color',
          'material',
          'proveedor',
          'modelo',
          'stock',
          'precio',
          'moneda',
          'aplica_iva',
          'precio_con_iva',
          'activo',
          'requiere_formula',
          'created_at',
          'updated_at',
          'cristal_config',
          'montura_config',
          'lente_contacto_config',
          'liquido_config',
          'estuche_config',
          'accesorio_config'
        ]
      }
    ]
  },
  {
    model: Cliente,
    as: 'cliente_referencia',
    required: false,
    attributes: ['id', 'cedula', 'nombre', 'telefono', 'email']
  },
  {
    model: Usuario,
    as: 'creater_user',
    required: false,
    attributes: ['id', 'cedula', 'nombre']
  },
  {
    model: Usuario,
    as: 'asesor_user',
    required: false,
    attributes: ['id', 'cedula', 'nombre']
  }
];

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarTextoNullable(valor) {
  const texto = normalizarTexto(valor);
  return texto !== '' ? texto : null;
}

function normalizarNumero(valor, fallback = 0) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return fallback;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function normalizarEntero(valor, fallback = null) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return fallback;
  }

  const numero = Number.parseInt(valor, 10);
  return Number.isInteger(numero) ? numero : fallback;
}

function normalizarBanderaBooleana(valor) {
  if (typeof valor === 'boolean') {
    return valor;
  }

  if (typeof valor === 'number') {
    return valor === 1;
  }

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase();

    if (['true', '1', 'si', 'sí', 'yes'].includes(texto)) {
      return true;
    }

    if (['false', '0', 'no', 'null', 'undefined', ''].includes(texto)) {
      return false;
    }
  }

  return Boolean(valor);
}

function normalizarTextoCampoFormula(valor) {
  return String(valor ?? '').trim();
}

function parseDescripcionProductoCristalLegacy(descripcion) {
  const texto = String(descripcion ?? '');
  const startIndex = texto.indexOf(CRISTAL_CONFIG_START);
  const endIndex = texto.indexOf(CRISTAL_CONFIG_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return {
      descripcionUsuario: texto.trim(),
      crystalConfig: null
    };
  }

  const payloadTexto = texto.slice(startIndex + CRISTAL_CONFIG_START.length, endIndex).trim();

  try {
    const payload = JSON.parse(payloadTexto);
    return {
      descripcionUsuario: normalizarTexto(payload?.descripcionUsuario ?? ''),
      crystalConfig: payload?.crystalConfig && typeof payload.crystalConfig === 'object' ? payload.crystalConfig : null
    };
  } catch {
    return {
      descripcionUsuario: texto.trim(),
      crystalConfig: null
    };
  }
}

function descripcionEsPayloadCristalLegacy(descripcion) {
  const texto = String(descripcion ?? '');
  return texto.includes(CRISTAL_CONFIG_START) && texto.includes(CRISTAL_CONFIG_END);
}

function construirNombreCristalDesdeConfig(config) {
  if (!config || typeof config !== 'object') {
    return '';
  }

  const nombreExplicito = normalizarTexto(config?.nombre);
  if (nombreExplicito) {
    return nombreExplicito;
  }

  return [
    normalizarTexto(config?.tipoCristal || config?.modelo),
    normalizarTexto(config?.presentacion),
    normalizarTexto(config?.material),
    ...(Array.isArray(config?.tratamientos) ? config.tratamientos.map((item) => normalizarTexto(item)) : []),
    normalizarTexto(config?.rangoFormula)
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function construirDescripcionCristalDesdeConfig(config) {
  const tipo = normalizarTexto(config?.tipoCristal || config?.modelo).toLowerCase();
  const presentacion = normalizarTexto(config?.presentacion).toLowerCase();
  const material = normalizarTexto(config?.material).toLowerCase();
  const tratamientos = normalizarArrayTextos(config?.tratamientos).map((item) => item.toLowerCase());
  const rangoFormula = normalizarTexto(config?.rangoFormula);
  const partes = [];
  const tipoDetallado = [tipo, presentacion].filter(Boolean).join(' ');

  partes.push(tipoDetallado ? `Cristal ${tipoDetallado}` : 'Cristal formulado');

  if (material) {
    partes.push(`en material ${material}`);
  }

  if (tratamientos.length) {
    partes.push(`con ${tratamientos.join(' y ')}`);
  }

  if (rangoFormula) {
    partes.push(`para rango de formula ${rangoFormula}`);
  }

  return `${partes.join(', ')}.`.replace(/\s+,/g, ',').replace(/\.+$/, '.');
}

function construirCristalConfigInventario(producto) {
  const descripcionLegacy = parseDescripcionProductoCristalLegacy(producto?.descripcion);
  const baseConfig = {
    ...(producto?.cristal_config && typeof producto.cristal_config === 'object' ? producto.cristal_config : {}),
    ...(descripcionLegacy?.crystalConfig && typeof descripcionLegacy.crystalConfig === 'object' ? descripcionLegacy.crystalConfig : {})
  };
  const nombre = normalizarTexto(baseConfig.nombre)
    || normalizarTexto(producto?.nombre)
    || construirNombreCristalDesdeConfig(baseConfig)
    || null;
  const descripcion = normalizarTexto(baseConfig.descripcion)
    || normalizarTexto(descripcionLegacy.descripcionUsuario)
    || construirDescripcionCristalDesdeConfig(baseConfig)
    || null;

  return {
    ...baseConfig,
    nombre,
    descripcion
  };
}

function obtenerNombreInventarioDesdeProducto(producto) {
  if (!producto) {
    return '';
  }

  if (normalizarTexto(producto?.categoria) === 'Cristales') {
    return normalizarTexto(construirCristalConfigInventario(producto)?.nombre);
  }

  return normalizarTexto(
    producto?.cristal_config?.nombre
    || producto?.montura_config?.nombre
    || producto?.lente_contacto_config?.nombre
    || producto?.liquido_config?.nombre
    || producto?.estuche_config?.nombre
    || producto?.accesorio_config?.nombre
    || producto?.nombre
  );
}

function obtenerDescripcionInventarioDesdeProducto(producto) {
  if (!producto) {
    return '';
  }

  if (normalizarTexto(producto?.categoria) === 'Cristales') {
    return normalizarTexto(construirCristalConfigInventario(producto)?.descripcion);
  }

  const descripcionTopLevel = descripcionEsPayloadCristalLegacy(producto?.descripcion)
    ? ''
    : normalizarTexto(producto?.descripcion);

  return normalizarTexto(
    producto?.cristal_config?.descripcion
    || producto?.montura_config?.descripcion
    || producto?.lente_contacto_config?.descripcion
    || producto?.liquido_config?.descripcion
    || producto?.estuche_config?.descripcion
    || producto?.accesorio_config?.descripcion
    || descripcionTopLevel
  );
}

function normalizarArrayTextos(valor) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(new Set(
    valor
      .map((item) => normalizarTexto(item))
      .filter(Boolean)
  ));
}

function normalizarNumeroNullable(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? Number(numero.toFixed(2)) : null;
}

function construirProductoRelacionadoOutput(producto) {
  if (!producto) {
    return null;
  }

  const categoria = normalizarTexto(producto.categoria);
  const descripcionLegacy = parseDescripcionProductoCristalLegacy(producto.descripcion);
  const base = {
    id: producto.id,
    sede_id: producto.sede_id,
    codigo: producto.codigo,
    stock: Number(producto.stock ?? 0),
    precio: Number(producto.precio ?? 0),
    aplicaIva: Boolean(producto.aplica_iva),
    precioConIva: Number(producto.precio_con_iva ?? 0),
    moneda: producto.moneda,
    activo: Boolean(producto.activo),
    created_at: producto.created_at,
    updated_at: producto.updated_at,
    requiere_formula: Boolean(producto.requiere_formula)
  };

  if (categoria === 'Cristales') {
    const cristalConfig = construirCristalConfigInventario(producto);
    return {
      ...base,
      cristalConfig: {
        categoria: 'Cristales',
        nombre: normalizarTextoNullable(cristalConfig?.nombre),
        marca: normalizarTextoNullable(cristalConfig?.marca),
        tipoCristal: normalizarTextoNullable(cristalConfig?.tipoCristal ?? cristalConfig?.modelo),
        presentacion: normalizarTextoNullable(cristalConfig?.presentacion),
        modelo: normalizarTextoNullable(cristalConfig?.modelo ?? cristalConfig?.tipoCristal),
        material: normalizarTextoNullable(cristalConfig?.material),
        color: cristalConfig?.color ?? null,
        proveedor: normalizarTextoNullable(cristalConfig?.proveedor),
        tratamientos: normalizarArrayTextos(cristalConfig?.tratamientos),
        rangoFormula: normalizarTextoNullable(cristalConfig?.rangoFormula),
        materialOtro: normalizarTextoNullable(cristalConfig?.materialOtro) ?? '',
        costoLaboratorio: normalizarNumeroNullable(cristalConfig?.costoLaboratorio),
        descripcion: normalizarTextoNullable(cristalConfig?.descripcion)
      }
    };
  }

  const descripcion = obtenerDescripcionInventarioDesdeProducto(producto) || null;

  switch (categoria) {
    case 'Monturas':
      return {
        ...base,
        descripcion,
        monturaConfig: {
          categoria: 'Monturas',
          nombre: obtenerNombreInventarioDesdeProducto(producto) || null,
          marca: normalizarTextoNullable(producto?.montura_config?.marca),
          modelo: normalizarTextoNullable(producto?.montura_config?.modelo),
          color: normalizarTextoNullable(producto?.montura_config?.color),
          material: normalizarTextoNullable(producto?.montura_config?.material),
          proveedor: normalizarTextoNullable(producto?.montura_config?.proveedor),
          descripcion
        }
      };
    case 'Lentes de contacto':
      return {
        ...base,
        descripcion,
        lenteContactoConfig: {
          categoria: 'Lentes de contacto',
          nombre: obtenerNombreInventarioDesdeProducto(producto) || null,
          marca: normalizarTextoNullable(producto?.lente_contacto_config?.marca),
          tipoLenteContacto: normalizarTextoNullable(producto?.lente_contacto_config?.tipoLenteContacto ?? producto?.lente_contacto_config?.modelo),
          modelo: normalizarTextoNullable(producto?.lente_contacto_config?.modelo ?? producto?.lente_contacto_config?.tipoLenteContacto),
          color: normalizarTextoNullable(producto?.lente_contacto_config?.color),
          material: normalizarTextoNullable(producto?.lente_contacto_config?.material),
          proveedor: normalizarTextoNullable(producto?.lente_contacto_config?.proveedor),
          rangoFormula: normalizarTextoNullable(producto?.lente_contacto_config?.rangoFormula),
          descripcion
        }
      };
    case 'Líquidos':
      return {
        ...base,
        descripcion,
        liquidoConfig: {
          categoria: 'Líquidos',
          nombre: obtenerNombreInventarioDesdeProducto(producto) || null,
          marca: normalizarTextoNullable(producto?.liquido_config?.marca),
          modelo: normalizarTextoNullable(producto?.liquido_config?.modelo),
          proveedor: normalizarTextoNullable(producto?.liquido_config?.proveedor),
          descripcion
        }
      };
    case 'Estuches':
      return {
        ...base,
        descripcion,
        estucheConfig: {
          categoria: 'Estuches',
          nombre: obtenerNombreInventarioDesdeProducto(producto) || null,
          marca: normalizarTextoNullable(producto?.estuche_config?.marca),
          modelo: normalizarTextoNullable(producto?.estuche_config?.modelo),
          material: normalizarTextoNullable(producto?.estuche_config?.material),
          proveedor: normalizarTextoNullable(producto?.estuche_config?.proveedor),
          descripcion
        }
      };
    case 'Accesorios':
      return {
        ...base,
        descripcion,
        accesorioConfig: {
          categoria: 'Accesorios',
          nombre: obtenerNombreInventarioDesdeProducto(producto) || null,
          marca: normalizarTextoNullable(producto?.accesorio_config?.marca),
          modelo: normalizarTextoNullable(producto?.accesorio_config?.modelo),
          color: normalizarTextoNullable(producto?.accesorio_config?.color),
          material: normalizarTextoNullable(producto?.accesorio_config?.material),
          proveedor: normalizarTextoNullable(producto?.accesorio_config?.proveedor),
          descripcion
        }
      };
    default:
      return {
        ...base,
        descripcion
      };
  }
}

function obtenerNombreDesdeProductoOutput(productoOutput) {
  if (!productoOutput) {
    return '';
  }

  return normalizarTexto(
    productoOutput?.cristalConfig?.nombre
    || productoOutput?.monturaConfig?.nombre
    || productoOutput?.lenteContactoConfig?.nombre
    || productoOutput?.liquidoConfig?.nombre
    || productoOutput?.estucheConfig?.nombre
    || productoOutput?.accesorioConfig?.nombre
  );
}

function obtenerDescripcionDesdeProductoOutput(productoOutput) {
  if (!productoOutput) {
    return '';
  }

  return normalizarTexto(
    productoOutput?.cristalConfig?.descripcion
    || productoOutput?.monturaConfig?.descripcion
    || productoOutput?.lenteContactoConfig?.descripcion
    || productoOutput?.liquidoConfig?.descripcion
    || productoOutput?.estucheConfig?.descripcion
    || productoOutput?.accesorioConfig?.descripcion
    || productoOutput?.descripcion
  );
}

function normalizarRefraccionFinalInput(refraccion) {
  if (!refraccion || typeof refraccion !== 'object') {
    return null;
  }

  return {
    od: {
      esfera: normalizarTextoCampoFormula(refraccion?.od?.esfera),
      cilindro: normalizarTextoCampoFormula(refraccion?.od?.cilindro),
      eje: normalizarTextoCampoFormula(refraccion?.od?.eje),
      adicion: normalizarTextoCampoFormula(refraccion?.od?.adicion),
      alt: normalizarTextoCampoFormula(refraccion?.od?.alt),
      dp: normalizarTextoCampoFormula(refraccion?.od?.dp)
    },
    oi: {
      esfera: normalizarTextoCampoFormula(refraccion?.oi?.esfera),
      cilindro: normalizarTextoCampoFormula(refraccion?.oi?.cilindro),
      eje: normalizarTextoCampoFormula(refraccion?.oi?.eje),
      adicion: normalizarTextoCampoFormula(refraccion?.oi?.adicion),
      alt: normalizarTextoCampoFormula(refraccion?.oi?.alt),
      dp: normalizarTextoCampoFormula(refraccion?.oi?.dp)
    }
  };
}

function tieneRefraccionMinimaCompleta(refraccionFinal) {
  if (!refraccionFinal || typeof refraccionFinal !== 'object') {
    return false;
  }

  return Boolean(
    normalizarTextoCampoFormula(refraccionFinal?.od?.esfera)
    && normalizarTextoCampoFormula(refraccionFinal?.od?.cilindro)
    && normalizarTextoCampoFormula(refraccionFinal?.od?.eje)
    && normalizarTextoCampoFormula(refraccionFinal?.oi?.esfera)
    && normalizarTextoCampoFormula(refraccionFinal?.oi?.cilindro)
    && normalizarTextoCampoFormula(refraccionFinal?.oi?.eje)
  );
}

function extraerFormulaExternaInput(payload, fallback = null) {
  const formulaObj = payload?.formulaExterna && typeof payload.formulaExterna === 'object'
    ? payload.formulaExterna
    : {};

  const activa = normalizarBanderaBooleana(
    formulaObj?.activa
      ?? payload?.formulaExternaActiva
      ?? payload?.formula_externa
      ?? fallback?.activa
      ?? false
  );

  const refraccionRaw = formulaObj?.refraccionFinal
    ?? payload?.formulaExternaRefraccionFinal
    ?? payload?.formula_externa_refraccion_final
    ?? fallback?.refraccionFinal
    ?? null;

  const refraccionFinal = normalizarRefraccionFinalInput(refraccionRaw);

  if (activa && !tieneRefraccionMinimaCompleta(refraccionFinal)) {
    throw { message: 'Para fórmula externa debe enviar refracción final completa (OD/OI: esfera, cilindro y eje).' };
  }

  return {
    activa,
    refraccionFinal: activa ? refraccionFinal : null
  };
}

function generarPresupuestoKey() {
  return `PTO-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function normalizarFecha(valor, fallback = null) {
  if (!valor) {
    return fallback;
  }

  const fecha = valor instanceof Date ? new Date(valor) : new Date(String(valor));
  if (Number.isNaN(fecha.getTime())) {
    return fallback;
  }

  return fecha;
}

function calcularDiasRestantes(fechaVencimiento) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fecha = new Date(fechaVencimiento);
  fecha.setHours(0, 0, 0, 0);

  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function resolverEstadoVigencia(fechaVencimiento) {
  return calcularDiasRestantes(fechaVencimiento) < 0 ? 'vencido' : 'vigente';
}

function resolverEstadoPersistido(estadoInput, fechaVencimiento) {
  const estado = normalizarTexto(estadoInput).toLowerCase();
  if (['convertido', 'anulado', 'archivado'].includes(estado)) {
    return estado;
  }

  return resolverEstadoVigencia(fechaVencimiento);
}

function construirEstadoColor(estado, diasRestantes) {
  if (estado === 'anulado') return 'anulado';
  if (estado === 'archivado') return 'archivado';
  if (estado === 'convertido') return 'convertido';
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes === 0) return 'hoy';
  if (diasRestantes <= 3) return 'proximo';
  return 'vigente';
}

function normalizarTipoPersona(valor) {
  const tipo = normalizarTexto(valor).toLowerCase();
  return tipo === 'juridica' ? 'juridica' : 'natural';
}

function extraerClienteInput(payload) {
  const cliente = payload?.cliente && typeof payload.cliente === 'object' ? payload.cliente : payload;
  const tipoPersona = normalizarTipoPersona(cliente?.tipoPersona);
  const nombre = tipoPersona === 'juridica'
    ? (normalizarTexto(cliente?.razonSocial) || normalizarTexto(cliente?.nombreCompleto) || normalizarTexto(cliente?.nombre))
    : (normalizarTexto(cliente?.nombreCompleto) || normalizarTexto(cliente?.nombre));

  return {
    tipoPersona,
    cedula: normalizarTexto(cliente?.cedula),
    nombre,
    telefono: normalizarTextoNullable(cliente?.telefono),
    email: normalizarTextoNullable(cliente?.email),
    direccion: normalizarTextoNullable(cliente?.direccion),
    razonSocial: normalizarTextoNullable(cliente?.razonSocial)
  };
}

function validarClienteInput(cliente) {
  if (!VerificationUtils.verify_nombre(cliente.cedula)) {
    throw { message: 'La cédula o RIF del cliente es obligatoria.' };
  }

  if (!VerificationUtils.verify_nombre(cliente.nombre)) {
    throw { message: 'El nombre del cliente es obligatorio.' };
  }

  const cedulaLimpia = cliente.cedula.replace(/\s+/g, '');
  if (cliente.tipoPersona === 'juridica') {
    if (!/^[JjVvGgEe]-?\d{7,9}$/.test(cedulaLimpia)) {
      throw { message: 'El RIF del cliente no tiene un formato válido.' };
    }
  } else if (!/^\d{4,}$/.test(cedulaLimpia)) {
    throw { message: 'La cédula del cliente no tiene un formato válido.' };
  }

  if (cliente.telefono && !VerificationUtils.verify_telefono(cliente.telefono.replace(/\D/g, ''))) {
    throw { message: 'El teléfono del cliente no tiene un formato válido.' };
  }

  if (cliente.email && !VerificationUtils.verify_correo(cliente.email)) {
    throw { message: 'El correo del cliente no es válido.' };
  }
}

function extraerContextoHistoriaInput(payload) {
  const historia = payload?.historia && typeof payload.historia === 'object' ? payload.historia : {};

  return {
    historiaMedicaId: normalizarTextoNullable(
      historia?.id
      ?? payload?.historiaMedicaId
      ?? payload?.historia_medica_id
      ?? payload?.historiaId
    ),
    historiaNumero: normalizarTextoNullable(
      historia?.numero
      ?? payload?.historiaNumero
      ?? payload?.historia_numero
    ),
    pacienteKeyOrigen: normalizarTextoNullable(
      historia?.pacienteKey
      ?? payload?.pacienteKeyOrigen
      ?? payload?.paciente_key_origen
      ?? payload?.cliente?.pacienteKey
    ),
    pacienteIdOrigen: normalizarTextoNullable(
      historia?.pacienteId
      ?? payload?.pacienteIdOrigen
      ?? payload?.paciente_id_origen
      ?? payload?.cliente?.pacienteId
    )
  };
}

function extraerConfiguracionTecnicaProducto(producto, itemInput) {
  if (itemInput?.configuracionTecnica && typeof itemInput.configuracionTecnica === 'object') {
    return {
      ...itemInput.configuracionTecnica,
      aplicaIva: itemInput?.aplicaIva !== undefined ? Boolean(itemInput.aplicaIva) : itemInput.configuracionTecnica?.aplicaIva,
      tipoItem: itemInput?.tipoItem || itemInput.configuracionTecnica?.tipoItem || null,
      esConsulta: itemInput?.esConsulta === true || itemInput.configuracionTecnica?.esConsulta === true
    };
  }

  if (!producto) {
    if (itemInput?.aplicaIva !== undefined || itemInput?.tipoItem || itemInput?.esConsulta) {
      return {
        aplicaIva: itemInput?.aplicaIva !== undefined ? Boolean(itemInput.aplicaIva) : true,
        tipoItem: itemInput?.tipoItem || null,
        esConsulta: itemInput?.esConsulta === true
      };
    }

    return null;
  }

  const config = {
    categoria: producto.categoria || null,
    cristalConfig: normalizarTexto(producto?.categoria) === 'Cristales'
      ? construirCristalConfigInventario(producto)
      : (producto.cristal_config || null),
    monturaConfig: producto.montura_config || null,
    lenteContactoConfig: producto.lente_contacto_config || null,
    liquidoConfig: producto.liquido_config || null,
    estucheConfig: producto.estuche_config || null,
    accesorioConfig: producto.accesorio_config || null,
    aplicaIva: itemInput?.aplicaIva !== undefined ? Boolean(itemInput.aplicaIva) : Boolean(producto.aplica_iva),
    tipoItem: itemInput?.tipoItem || null,
    esConsulta: itemInput?.esConsulta === true
  };

  const tieneDatos = Object.values(config).some((valor) => valor && (typeof valor !== 'object' || Object.keys(valor).length > 0));
  return tieneDatos ? config : null;
}

function fusionarConfiguracionTecnica(baseConfig, fallbackConfig) {
  if (!baseConfig && !fallbackConfig) {
    return null;
  }

  const base = baseConfig && typeof baseConfig === 'object' ? baseConfig : {};
  const fallback = fallbackConfig && typeof fallbackConfig === 'object' ? fallbackConfig : {};
  const obtenerBloque = (clave) => {
    const baseValor = base[clave];
    if (baseValor && typeof baseValor === 'object' && Object.keys(baseValor).length > 0) {
      return baseValor;
    }

    const fallbackValor = fallback[clave];
    if (fallbackValor && typeof fallbackValor === 'object' && Object.keys(fallbackValor).length > 0) {
      return fallbackValor;
    }

    return null;
  };

  const merged = {
    categoria: normalizarTextoNullable(base.categoria) || normalizarTextoNullable(fallback.categoria),
    cristalConfig: obtenerBloque('cristalConfig'),
    monturaConfig: obtenerBloque('monturaConfig'),
    lenteContactoConfig: obtenerBloque('lenteContactoConfig'),
    liquidoConfig: obtenerBloque('liquidoConfig'),
    estucheConfig: obtenerBloque('estucheConfig'),
    accesorioConfig: obtenerBloque('accesorioConfig'),
    aplicaIva: base.aplicaIva !== undefined ? base.aplicaIva : fallback.aplicaIva,
    tipoItem: base.tipoItem || fallback.tipoItem || null,
    esConsulta: base.esConsulta === true || fallback.esConsulta === true
  };

  const tieneDatos = Object.values(merged).some((valor) => valor && (typeof valor !== 'object' || Object.keys(valor).length > 0));
  return tieneDatos ? merged : null;
}

function calcularResumenLinea(cantidad, precioUnitario, descuentoPorcentaje) {
  const subtotalLinea = FormatUtils.float(cantidad * precioUnitario);
  const totalLinea = FormatUtils.float(subtotalLinea * (1 - (descuentoPorcentaje / 100)));
  return { subtotalLinea, totalLinea };
}

function lineaAplicaIva(item) {
  const config = item?.configuracion_tecnica;

  if (config && typeof config === 'object' && config.aplicaIva !== undefined) {
    return config.aplicaIva === true;
  }

  if (item?.producto && item.producto.aplica_iva !== undefined) {
    return Boolean(item.producto.aplica_iva);
  }

  return true;
}

function construirResumenTotales(items, ivaPorcentaje) {
  const subtotal = FormatUtils.float(items.reduce((acc, item) => acc + item.total_linea, 0));
  const subtotalBruto = FormatUtils.float(items.reduce((acc, item) => acc + item.subtotal_linea, 0));
  const descuentoTotal = FormatUtils.float(Math.max(0, subtotalBruto - subtotal));
  const baseGravable = FormatUtils.float(items.reduce((acc, item) => {
    if (!lineaAplicaIva(item)) {
      return acc;
    }

    return acc + Number(item.total_linea || 0);
  }, 0));
  const iva = FormatUtils.float(baseGravable * (ivaPorcentaje / 100));
  const total = FormatUtils.float(subtotal + iva);

  return { subtotal, descuentoTotal, iva, total };
}

function mapPresupuestoProductoOutput(item) {
  const productoRelacionado = item?.producto || null;
  const productoOutput = construirProductoRelacionadoOutput(productoRelacionado);
  const configPersistida = item?.configuracion_tecnica || item?.configuracionTecnica || null;
  const configInventario = extraerConfiguracionTecnicaProducto(productoRelacionado, item) || null;
  const config = fusionarConfiguracionTecnica(configPersistida, configInventario);
  const descripcionLegacyCristal = parseDescripcionProductoCristalLegacy(item?.descripcion);
  const cristalConfig = config?.cristalConfig || descripcionLegacyCristal.crystalConfig || null;
  const nombreCristal = construirNombreCristalDesdeConfig(cristalConfig);
  const nombreInventario = obtenerNombreDesdeProductoOutput(productoOutput) || obtenerNombreInventarioDesdeProducto(productoRelacionado);
  const descripcionInventario = obtenerDescripcionDesdeProductoOutput(productoOutput) || obtenerDescripcionInventarioDesdeProducto(productoRelacionado);
  const precio = Number(item?.precio_unitario ?? item?.precioUnitario ?? item?.precio ?? 0);
  const descuento = Number(item?.descuento_porcentaje ?? item?.descuentoPorcentaje ?? item?.descuento ?? 0);
  const subtotalLinea = Number(item?.subtotal_linea ?? item?.subtotalLinea ?? 0);
  const totalLinea = Number(item?.total_linea ?? item?.totalLinea ?? item?.total ?? 0);
  const productoId = item?.producto_id ?? item?.productoId ?? item?.id ?? null;
  const nombre = nombreInventario
    || normalizarTexto(item?.nombre)
    || nombreCristal
    || normalizarTexto(descripcionLegacyCristal.descripcionUsuario)
    || normalizarTexto(item?.descripcion)
    || normalizarTexto(item?.producto_codigo)
    || normalizarTexto(item?.codigo);
  const descripcion = descripcionInventario
    || normalizarTexto(item?.descripcion)
    || normalizarTexto(descripcionLegacyCristal.descripcionUsuario)
    || nombre;

  return {
    productoId: productoId !== null && productoId !== undefined ? Number(productoId) : null,
    id: productoId !== null && productoId !== undefined ? Number(productoId) : null,
    nombre: nombre || null,
    codigo: item?.producto_codigo ?? item?.codigo ?? null,
    descripcion: descripcion || '',
    precio: precio,
    precioUnitario: precio,
    cantidad: Number(item?.cantidad || 0),
    descuento: descuento,
    descuentoPorcentaje: descuento,
    aplicaIva: lineaAplicaIva(item),
    tipoItem: config?.tipoItem || item?.tipoItem || null,
    esConsulta: config?.esConsulta === true || item?.esConsulta === true,
    moneda: item?.moneda || null,
    precioOriginal: item?.precio_original !== undefined && item?.precio_original !== null
      ? Number(item?.precio_original || 0)
      : (item?.precioOriginal !== undefined && item?.precioOriginal !== null ? Number(item?.precioOriginal || 0) : null),
    monedaOriginal: item?.moneda_original ?? item?.monedaOriginal ?? null,
    tasaConversion: item?.tasa_conversion !== undefined && item?.tasa_conversion !== null
      ? Number(item?.tasa_conversion || 0)
      : (item?.tasaConversion !== undefined && item?.tasaConversion !== null ? Number(item?.tasaConversion || 0) : null),
    subtotalLinea,
    total: totalLinea,
    configuracionTecnica: config,
    producto: productoOutput
  };
}

function construirOpcionesCotizadasFallback(plain, productos) {
  const opcionPrincipalId = normalizarTexto(plain?.opcion_principal_id) || 'opcion-1';

  return [{
    id: opcionPrincipalId,
    nombre: 'Opción 1',
    observaciones: null,
    subtotal: Number(plain?.subtotal || 0),
    descuentoTotal: Number(plain?.descuento_total || 0),
    iva: Number(plain?.iva || 0),
    total: Number(plain?.total || 0),
    esPrincipal: true,
    productos
  }];
}

function construirClaveProductoPresupuesto(producto) {
  const productoId = normalizarEntero(producto?.productoId ?? producto?.producto_id ?? producto?.id, null);
  if (productoId !== null) {
    return `id:${productoId}`;
  }

  const codigo = normalizarTexto(producto?.codigo ?? producto?.producto_codigo ?? producto?.productoCodigo);
  return codigo ? `codigo:${codigo}` : '';
}

function rehidratarProductoCotizadoPersistido(productoSnapshot, productosMap) {
  const clave = construirClaveProductoPresupuesto(productoSnapshot);
  const productoActual = clave ? productosMap.get(clave) : null;

  if (!productoActual) {
    return mapPresupuestoProductoOutput(productoSnapshot);
  }

  return {
    ...productoActual,
    cantidad: Number(productoSnapshot?.cantidad ?? productoActual?.cantidad ?? 0),
    precio: Number(productoSnapshot?.precio ?? productoSnapshot?.precioUnitario ?? productoActual?.precio ?? 0),
    precioUnitario: Number(productoSnapshot?.precioUnitario ?? productoSnapshot?.precio ?? productoActual?.precioUnitario ?? productoActual?.precio ?? 0),
    descuento: Number(productoSnapshot?.descuento ?? productoSnapshot?.descuentoPorcentaje ?? productoActual?.descuento ?? 0),
    descuentoPorcentaje: Number(productoSnapshot?.descuentoPorcentaje ?? productoSnapshot?.descuento ?? productoActual?.descuentoPorcentaje ?? 0),
    subtotalLinea: Number(productoSnapshot?.subtotalLinea ?? productoActual?.subtotalLinea ?? 0),
    total: Number(productoSnapshot?.total ?? productoActual?.total ?? 0),
    moneda: productoSnapshot?.moneda || productoActual?.moneda || null,
    precioOriginal: productoSnapshot?.precioOriginal ?? productoActual?.precioOriginal ?? null,
    monedaOriginal: productoSnapshot?.monedaOriginal ?? productoActual?.monedaOriginal ?? null,
    tasaConversion: productoSnapshot?.tasaConversion ?? productoActual?.tasaConversion ?? null,
    tipoItem: productoSnapshot?.tipoItem || productoActual?.tipoItem || null,
    esConsulta: productoSnapshot?.esConsulta === true || productoActual?.esConsulta === true,
    aplicaIva: productoSnapshot?.aplicaIva !== undefined ? Boolean(productoSnapshot.aplicaIva) : productoActual?.aplicaIva,
    configuracionTecnica: productoActual?.configuracionTecnica || productoSnapshot?.configuracionTecnica || null,
    producto: productoActual?.producto || productoSnapshot?.producto || null
  };
}

function normalizarOpcionCotizadaPersistida(opcion, index, productosMap = new Map()) {
  const productos = Array.isArray(opcion?.productos)
    ? opcion.productos.map((producto) => rehidratarProductoCotizadoPersistido(producto, productosMap))
    : [];

  return {
    id: normalizarTexto(opcion?.id) || `opcion-${index + 1}`,
    nombre: normalizarTexto(opcion?.nombre) || `Opción ${index + 1}`,
    observaciones: normalizarTextoNullable(opcion?.observaciones),
    subtotal: Number(opcion?.subtotal || 0),
    descuentoTotal: Number(opcion?.descuentoTotal || 0),
    iva: Number(opcion?.iva || 0),
    total: Number(opcion?.total || 0),
    esPrincipal: normalizarBanderaBooleana(opcion?.esPrincipal),
    productos
  };
}

async function normalizarOpcionesCotizadasInput(payload, sedeId, moneda, ivaPorcentaje, transaction) {
  const opcionesInput = Array.isArray(payload?.opciones) ? payload.opciones : [];

  if (!opcionesInput.length) {
    const items = await normalizarItemsInput(payload.productos || payload.items, sedeId, moneda, transaction);
    const resumen = construirResumenTotales(items, ivaPorcentaje);
    const opcionPrincipalId = normalizarTexto(payload?.opcionPrincipalId || payload?.opcion_principal_id) || 'opcion-1';

    return {
      opcionPrincipalId,
      itemsPrincipal: items,
      resumenPrincipal: resumen,
      opciones: [{
        id: opcionPrincipalId,
        nombre: 'Opción 1',
        observaciones: null,
        subtotal: resumen.subtotal,
        descuentoTotal: resumen.descuentoTotal,
        iva: resumen.iva,
        total: resumen.total,
        esPrincipal: true,
        productos: items.map((item) => mapPresupuestoProductoOutput(item))
      }]
    };
  }

  const opcionesNormalizadas = [];

  for (let index = 0; index < opcionesInput.length; index += 1) {
    const opcionInput = opcionesInput[index];
    const items = await normalizarItemsInput(opcionInput?.productos || opcionInput?.items, sedeId, moneda, transaction);
    const resumen = construirResumenTotales(items, ivaPorcentaje);

    opcionesNormalizadas.push({
      id: normalizarTexto(opcionInput?.id) || `opcion-${index + 1}`,
      nombre: normalizarTexto(opcionInput?.nombre) || `Opción ${index + 1}`,
      observaciones: normalizarTextoNullable(opcionInput?.observaciones),
      subtotal: resumen.subtotal,
      descuentoTotal: resumen.descuentoTotal,
      iva: resumen.iva,
      total: resumen.total,
      esPrincipal: normalizarBanderaBooleana(opcionInput?.esPrincipal),
      productos: items.map((item) => mapPresupuestoProductoOutput(item)),
      _items: items,
      _resumen: resumen
    });
  }

  let opcionPrincipalId = normalizarTexto(payload?.opcionPrincipalId || payload?.opcion_principal_id)
    || opcionesNormalizadas.find((opcion) => opcion.esPrincipal)?.id
    || opcionesNormalizadas[0]?.id;

  if (!opcionesNormalizadas.some((opcion) => opcion.id === opcionPrincipalId)) {
    opcionPrincipalId = opcionesNormalizadas[0]?.id;
  }

  opcionesNormalizadas.forEach((opcion) => {
    opcion.esPrincipal = opcion.id === opcionPrincipalId;
  });

  const opcionPrincipal = opcionesNormalizadas.find((opcion) => opcion.id === opcionPrincipalId) || opcionesNormalizadas[0];

  return {
    opcionPrincipalId,
    itemsPrincipal: opcionPrincipal?._items || [],
    resumenPrincipal: opcionPrincipal?._resumen || construirResumenTotales([], ivaPorcentaje),
    opciones: opcionesNormalizadas.map(({ _items, _resumen, ...opcion }) => opcion)
  };
}

async function generarSiguienteCodigo(sedeId, year, transaction) {
  const prefix = `P-${year}-`;
  const presupuestos = await Presupuesto.findAll({
    where: {
      sede_id: sedeId,
      codigo: { [Op.like]: `${prefix}%` }
    },
    attributes: ['codigo'],
    paranoid: false,
    transaction
  });

  const maximo = presupuestos.reduce((actual, presupuesto) => {
    const match = String(presupuesto.codigo || '').match(/^P-(\d{4})-(\d+)$/i);
    if (!match || Number(match[1]) !== year) {
      return actual;
    }
    return Math.max(actual, Number(match[2] || 0));
  }, 0);

  return `P-${year}-${String(maximo + 1).padStart(3, '0')}`;
}

async function resolverClienteReferencia(cliente, sedeId, transaction) {
  if (!cliente?.cedula) {
    return null;
  }

  return Cliente.findOne({
    where: {
      sede_id: sedeId,
      cedula: cliente.cedula
    },
    transaction
  });
}

async function resolverAsesor(asesorId, transaction) {
  if (!asesorId) {
    return null;
  }

  const asesor = await Usuario.findOne({ where: { id: asesorId }, transaction });
  if (!asesor) {
    throw { message: 'El asesor enviado no existe.' };
  }

  return asesor;
}

async function normalizarItemsInput(itemsInput, sedeId, moneda, transaction) {
  const items = Array.isArray(itemsInput) ? itemsInput : [];
  if (!items.length) {
    throw { message: 'Debe enviar al menos una línea de producto en el presupuesto.' };
  }

  const productoIds = Array.from(new Set(
    items
      .map((item) => normalizarEntero(item?.productoId ?? item?.producto_id ?? item?.id, null))
      .filter((id) => id !== null)
  ));

  const productos = productoIds.length
    ? await Producto.findAll({
        where: {
          id: { [Op.in]: productoIds },
          sede_id: sedeId
        },
        transaction
      })
    : [];

  const productosMap = new Map(productos.map((producto) => [Number(producto.id), producto]));

  return items.map((item, index) => {
    const productoId = normalizarEntero(item?.productoId ?? item?.producto_id ?? item?.id, null);
    const producto = productoId !== null ? productosMap.get(productoId) : null;

    if (productoId !== null && !producto) {
      throw { message: `El producto ${productoId} no existe en la sede activa.` };
    }

    const descripcion = normalizarTexto(item?.descripcion)
      || obtenerDescripcionInventarioDesdeProducto(producto)
      || obtenerNombreInventarioDesdeProducto(producto)
      || normalizarTexto(producto?.nombre);

    if (!VerificationUtils.verify_nombre(descripcion)) {
      throw { message: `La descripción de la línea ${index + 1} es obligatoria.` };
    }

    const cantidad = normalizarEntero(item?.cantidad, 1);
    if (!cantidad || cantidad < 1) {
      throw { message: `La cantidad de la línea ${index + 1} debe ser mayor o igual a 1.` };
    }

    const precioUnitario = normalizarNumero(item?.precioUnitario ?? item?.precio, NaN);
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw { message: `El precio unitario de la línea ${index + 1} es inválido.` };
    }

    const descuentoPorcentaje = normalizarNumero(item?.descuentoPorcentaje ?? item?.descuento, 0);
    if (descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
      throw { message: `El descuento de la línea ${index + 1} debe estar entre 0 y 100.` };
    }

    const { subtotalLinea, totalLinea } = calcularResumenLinea(cantidad, precioUnitario, descuentoPorcentaje);

    return {
      presupuesto_id: null,
      posicion: index + 1,
      producto_id: producto ? Number(producto.id) : null,
      producto_codigo: normalizarTextoNullable(item?.codigo ?? item?.productoCodigo ?? producto?.codigo),
      descripcion,
      cantidad,
      precio_unitario: FormatUtils.float(precioUnitario),
      descuento_porcentaje: FormatUtils.float(descuentoPorcentaje),
      subtotal_linea: subtotalLinea,
      total_linea: totalLinea,
      moneda: normalizarTexto(item?.moneda) || normalizarTexto(producto?.moneda) || moneda,
      precio_original: FormatUtils.float(normalizarNumero(item?.precioOriginal ?? item?.precio, precioUnitario)),
      moneda_original: normalizarTextoNullable(item?.monedaOriginal ?? item?.moneda ?? producto?.moneda ?? moneda),
      tasa_conversion: normalizarNumero(item?.tasaConversion, 1),
      configuracion_tecnica: extraerConfiguracionTecnicaProducto(producto, item)
    };
  });
}

function mapPresupuestoOutput(presupuesto) {
  const plain = presupuesto.get ? presupuesto.get({ plain: true }) : presupuesto;
  const diasRestantes = calcularDiasRestantes(plain.fecha_vencimiento);
  const estadoVigente = ['convertido', 'anulado', 'archivado'].includes(plain.estado)
    ? plain.estado
    : resolverEstadoVigencia(plain.fecha_vencimiento);
  const estadoColor = construirEstadoColor(estadoVigente, diasRestantes);
  const productos = Array.isArray(plain.items)
    ? plain.items.map((item) => mapPresupuestoProductoOutput(item))
    : [];
  const productosMap = new Map(
    productos
      .map((producto) => [construirClaveProductoPresupuesto(producto), producto])
      .filter(([clave]) => Boolean(clave))
  );
  const opciones = Array.isArray(plain.opciones_cotizadas) && plain.opciones_cotizadas.length > 0
    ? plain.opciones_cotizadas.map((opcion, index) => normalizarOpcionCotizadaPersistida(opcion, index, productosMap))
    : construirOpcionesCotizadasFallback(plain, productos);
  const opcionPrincipalId = normalizarTexto(plain.opcion_principal_id)
    || opciones.find((opcion) => opcion.esPrincipal)?.id
    || opciones[0]?.id
    || null;

  opciones.forEach((opcion) => {
    opcion.esPrincipal = opcion.id === opcionPrincipalId;
  });
  const opcionPrincipal = opciones.find((opcion) => opcion.id === opcionPrincipalId) || opciones[0] || null;

  return {
    id: plain.id,
    presupuestoKey: plain.presupuesto_key,
    codigo: plain.codigo,
    origen: plain.origen || 'manual',
    sede_id: plain.sede_id,
    historiaMedicaId: plain.historia_medica_id || null,
    historiaNumero: plain.historia_numero || null,
    pacienteKeyOrigen: plain.paciente_key_origen || null,
    pacienteIdOrigen: plain.paciente_id_origen || null,
    historia: {
      id: plain.historia_medica_id || null,
      numero: plain.historia_numero || null,
      pacienteKey: plain.paciente_key_origen || null,
      pacienteId: plain.paciente_id_origen || null
    },
    cliente: {
      id: plain.cliente_ref_id || plain.cliente_referencia?.id || null,
      tipoPersona: plain.cliente_tipo_persona,
      cedula: plain.cliente_cedula,
      nombreCompleto: plain.cliente_nombre,
      telefono: plain.cliente_telefono,
      email: plain.cliente_email,
      direccion: plain.cliente_direccion,
      razonSocial: plain.cliente_razon_social,
      pacienteKey: plain.paciente_key_origen || null,
      pacienteId: plain.paciente_id_origen || null
    },
    vendedor: plain.vendedor_nombre || plain.asesor_user?.nombre || null,
    asesor: plain.asesor_user
      ? {
          id: plain.asesor_user.id,
          cedula: plain.asesor_user.cedula,
          nombre: plain.asesor_user.nombre
        }
      : null,
    moneda: plain.moneda,
    ivaPorcentaje: Number(plain.iva_porcentaje || 0),
    subtotal: Number(plain.subtotal || 0),
    descuentoTotal: Number(plain.descuento_total || 0),
    iva: Number(plain.iva || 0),
    total: Number(plain.total || 0),
    opcionPrincipalId,
    opciones,
    observaciones: plain.observaciones,
    formulaExterna: {
      activa: plain.formula_externa === true || Number(plain.formula_externa || 0) === 1,
      refraccionFinal: plain.formula_externa_refraccion_final || null
    },
    estado: estadoVigente,
    estadoColor,
    fechaCreacion: plain.fecha_creacion,
    fechaVencimiento: plain.fecha_vencimiento,
    diasVencimiento: Number(plain.dias_vencimiento || 0),
    diasRestantes,
    origen: plain.origen,
    ventaKeyOrigen: plain.venta_key_origen,
    archivadoAt: plain.archivado_at,
    productos: Array.isArray(opcionPrincipal?.productos) ? opcionPrincipal.productos : productos,
    createdBy: plain.created_by,
    updatedBy: plain.updated_by,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at
  };
}

async function obtenerPresupuestoPorId(id, sedeId) {
  const presupuesto = await Presupuesto.findOne({
    where: {
      id,
      sede_id: sedeId
    },
    include: PRESUPUESTO_INCLUDE
  });

  if (!presupuesto) {
    throw { message: 'El presupuesto solicitado no existe.' };
  }

  return mapPresupuestoOutput(presupuesto);
}

const PresupuestoService = {
  async get(req, id = null) {
    if (!req.user) {
      throw { message: 'Sesion invalida.' };
    }

    if (id) {
      const presupuesto = await obtenerPresupuestoPorId(id, req.sede.id);
      return { message: 'ok', presupuesto };
    }

    const busqueda = normalizarTexto(req.query.busquedaGeneral || req.query.q);
    const fechaDesde = normalizarTexto(req.query.fechaDesde);
    const fechaHasta = normalizarTexto(req.query.fechaHasta);
    const estadoFiltro = normalizarTexto(req.query.estado).toLowerCase();

    const where = { sede_id: req.sede.id };
    if (busqueda) {
      where[Op.or] = [
        { codigo: { [Op.like]: `%${busqueda}%` } },
        { cliente_cedula: { [Op.like]: `%${busqueda}%` } },
        { cliente_nombre: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (fechaDesde && fechaHasta) {
      where.fecha_creacion = {
        [Op.between]: [
          new Date(`${fechaDesde}T00:00:00.000`),
          new Date(`${fechaHasta}T23:59:59.999`)
        ]
      };
    }

    const presupuestos = await Presupuesto.findAll({
      where,
      include: PRESUPUESTO_INCLUDE,
      order: [['fecha_creacion', 'DESC'], ['id', 'DESC']]
    });

    let output = presupuestos.map(mapPresupuestoOutput);
    if (estadoFiltro && ESTADOS_VALIDOS.includes(estadoFiltro)) {
      output = output.filter((presupuesto) => presupuesto.estado === estadoFiltro || presupuesto.estadoColor === estadoFiltro);
    }

    return {
      message: 'ok',
      total: output.length,
      presupuestos: output
    };
  },

  async add(payload, req) {
    if (!req.user) {
      throw { message: 'Sesion invalida.' };
    }

    const t = await sequelize.transaction();
    try {
      const cliente = extraerClienteInput(payload);
      validarClienteInput(cliente);

      const monedaBase = await ConfiguracionService.get_moneda_base(req.sede.id);
      const moneda = normalizarTexto(payload.moneda || monedaBase?.valor) || 'dolar';
      const ivaPorcentaje = FormatUtils.float(normalizarNumero(payload.ivaPorcentaje ?? payload.impuesto, DEFAULT_IVA_PORCENTAJE));
      const fechaCreacion = normalizarFecha(payload.fechaCreacion, new Date());
      const fechaVencimiento = normalizarFecha(payload.fechaVencimiento);
      const diasVencimiento = normalizarEntero(payload.diasVencimiento, 7) || 7;
      const fechaVencimientoFinal = fechaVencimiento || new Date(fechaCreacion.getTime() + (diasVencimiento * 24 * 60 * 60 * 1000));

      if (!fechaVencimientoFinal) {
        throw { message: 'La fecha de vencimiento del presupuesto es obligatoria.' };
      }

      const opcionesCotizadas = await normalizarOpcionesCotizadasInput(payload, req.sede.id, moneda, ivaPorcentaje, t);
      const items = opcionesCotizadas.itemsPrincipal;
      const resumen = opcionesCotizadas.resumenPrincipal;
      const codigo = normalizarTexto(payload.codigo) || await generarSiguienteCodigo(req.sede.id, fechaCreacion.getFullYear(), t);
      const existente = await Presupuesto.findOne({ where: { sede_id: req.sede.id, codigo }, paranoid: false, transaction: t });
      if (existente) {
        throw { message: `Ya existe un presupuesto con el código ${codigo} en la sede actual.` };
      }

      const clienteReferencia = await resolverClienteReferencia(cliente, req.sede.id, t);
      const asesorId = normalizarEntero(payload.asesorId ?? payload.asesor_id ?? payload.vendedorId, null);
      const asesor = await resolverAsesor(asesorId, t);
      const formulaExterna = extraerFormulaExternaInput(payload);
      const contextoHistoria = extraerContextoHistoriaInput(payload);
      const presupuesto = await Presupuesto.create({
        presupuesto_key: generarPresupuestoKey(),
        codigo,
        sede_id: req.sede.id,
        cliente_ref_id: clienteReferencia ? clienteReferencia.id : null,
        cliente_tipo_persona: cliente.tipoPersona,
        cliente_cedula: cliente.cedula,
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_email: cliente.email,
        cliente_direccion: cliente.direccion,
        cliente_razon_social: cliente.razonSocial,
        historia_medica_id: contextoHistoria.historiaMedicaId,
        historia_numero: contextoHistoria.historiaNumero,
        paciente_key_origen: contextoHistoria.pacienteKeyOrigen,
        paciente_id_origen: contextoHistoria.pacienteIdOrigen,
        vendedor_nombre: normalizarTextoNullable(payload.vendedor || asesor?.nombre || req.user.nombre),
        asesor_id: asesor ? asesor.id : null,
        moneda,
        iva_porcentaje: ivaPorcentaje,
        subtotal: resumen.subtotal,
        descuento_total: resumen.descuentoTotal,
        iva: resumen.iva,
        total: resumen.total,
        observaciones: normalizarTextoNullable(payload.observaciones),
        formula_externa: formulaExterna.activa,
        formula_externa_refraccion_final: formulaExterna.refraccionFinal,
        opciones_cotizadas: opcionesCotizadas.opciones,
        opcion_principal_id: opcionesCotizadas.opcionPrincipalId,
        estado: resolverEstadoPersistido(payload.estado, fechaVencimientoFinal),
        fecha_creacion: fechaCreacion,
        fecha_vencimiento: fechaVencimientoFinal,
        dias_vencimiento: diasVencimiento,
        origen: normalizarTexto(payload.origen) || 'manual',
        venta_key_origen: normalizarTextoNullable(payload.ventaKeyOrigen || payload.venta_key_origen),
        archivado_at: null,
        created_by: req.user.cedula,
        updated_by: req.user.cedula
      }, { transaction: t });

      await PresupuestoItem.bulkCreate(
        items.map((item) => ({ ...item, presupuesto_id: presupuesto.id })),
        { transaction: t }
      );

      await t.commit();
      return {
        message: 'ok',
        presupuesto: await obtenerPresupuestoPorId(presupuesto.id, req.sede.id)
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async update(id, payload, req) {
    if (!req.user) {
      throw { message: 'Sesion invalida.' };
    }

    const t = await sequelize.transaction();
    try {
      const presupuesto = await Presupuesto.findOne({
        where: { id, sede_id: req.sede.id },
        transaction: t
      });

      if (!presupuesto) {
        throw { message: 'El presupuesto enviado no existe.' };
      }

      const cliente = extraerClienteInput(payload);
      validarClienteInput(cliente);

      const moneda = normalizarTexto(payload.moneda || presupuesto.moneda) || 'dolar';
      const ivaPorcentaje = FormatUtils.float(normalizarNumero(payload.ivaPorcentaje ?? payload.impuesto, Number(presupuesto.iva_porcentaje || DEFAULT_IVA_PORCENTAJE)));
      const fechaCreacion = normalizarFecha(payload.fechaCreacion, presupuesto.fecha_creacion);
      const fechaVencimiento = normalizarFecha(payload.fechaVencimiento, presupuesto.fecha_vencimiento);
      const diasVencimiento = normalizarEntero(payload.diasVencimiento, presupuesto.dias_vencimiento) || presupuesto.dias_vencimiento;
      const opcionesCotizadas = await normalizarOpcionesCotizadasInput(payload, req.sede.id, moneda, ivaPorcentaje, t);
      const items = opcionesCotizadas.itemsPrincipal;
      const resumen = opcionesCotizadas.resumenPrincipal;
      const codigo = normalizarTexto(payload.codigo) || presupuesto.codigo;

      const existente = await Presupuesto.findOne({
        where: {
          id: { [Op.ne]: presupuesto.id },
          sede_id: req.sede.id,
          codigo
        },
        paranoid: false,
        transaction: t
      });
      if (existente) {
        throw { message: `Ya existe un presupuesto con el código ${codigo} en la sede actual.` };
      }

      const clienteReferencia = await resolverClienteReferencia(cliente, req.sede.id, t);
      const asesorId = normalizarEntero(payload.asesorId ?? payload.asesor_id ?? payload.vendedorId ?? presupuesto.asesor_id, null);
      const asesor = await resolverAsesor(asesorId, t);
      const formulaExterna = extraerFormulaExternaInput(payload, {
        activa: presupuesto.formula_externa,
        refraccionFinal: presupuesto.formula_externa_refraccion_final
      });
      const contextoHistoria = extraerContextoHistoriaInput(payload);

      presupuesto.codigo = codigo;
      presupuesto.cliente_ref_id = clienteReferencia ? clienteReferencia.id : null;
      presupuesto.cliente_tipo_persona = cliente.tipoPersona;
      presupuesto.cliente_cedula = cliente.cedula;
      presupuesto.cliente_nombre = cliente.nombre;
      presupuesto.cliente_telefono = cliente.telefono;
      presupuesto.cliente_email = cliente.email;
      presupuesto.cliente_direccion = cliente.direccion;
      presupuesto.cliente_razon_social = cliente.razonSocial;
      presupuesto.historia_medica_id = contextoHistoria.historiaMedicaId;
      presupuesto.historia_numero = contextoHistoria.historiaNumero;
      presupuesto.paciente_key_origen = contextoHistoria.pacienteKeyOrigen;
      presupuesto.paciente_id_origen = contextoHistoria.pacienteIdOrigen;
      presupuesto.vendedor_nombre = normalizarTextoNullable(payload.vendedor || asesor?.nombre || presupuesto.vendedor_nombre || req.user.nombre);
      presupuesto.asesor_id = asesor ? asesor.id : null;
      presupuesto.moneda = moneda;
      presupuesto.iva_porcentaje = ivaPorcentaje;
      presupuesto.subtotal = resumen.subtotal;
      presupuesto.descuento_total = resumen.descuentoTotal;
      presupuesto.iva = resumen.iva;
      presupuesto.total = resumen.total;
      presupuesto.observaciones = normalizarTextoNullable(payload.observaciones);
      presupuesto.formula_externa = formulaExterna.activa;
      presupuesto.formula_externa_refraccion_final = formulaExterna.refraccionFinal;
      presupuesto.opciones_cotizadas = opcionesCotizadas.opciones;
      presupuesto.opcion_principal_id = opcionesCotizadas.opcionPrincipalId;
      presupuesto.estado = resolverEstadoPersistido(payload.estado || presupuesto.estado, fechaVencimiento);
      presupuesto.fecha_creacion = fechaCreacion;
      presupuesto.fecha_vencimiento = fechaVencimiento;
      presupuesto.dias_vencimiento = diasVencimiento;
      presupuesto.origen = normalizarTexto(payload.origen) || presupuesto.origen || 'manual';
      presupuesto.venta_key_origen = normalizarTextoNullable(payload.ventaKeyOrigen || payload.venta_key_origen || presupuesto.venta_key_origen);
      presupuesto.archivado_at = presupuesto.estado === 'archivado' ? (presupuesto.archivado_at || new Date()) : null;
      presupuesto.updated_by = req.user.cedula;
      await presupuesto.save({ transaction: t });

      await PresupuestoItem.destroy({ where: { presupuesto_id: presupuesto.id }, transaction: t });
      await PresupuestoItem.bulkCreate(
        items.map((item) => ({ ...item, presupuesto_id: presupuesto.id })),
        { transaction: t }
      );

      await t.commit();
      return {
        message: 'ok',
        presupuesto: await obtenerPresupuestoPorId(presupuesto.id, req.sede.id)
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async delete(id, req) {
    if (!req.user) {
      throw { message: 'Sesion invalida.' };
    }

    const presupuesto = await Presupuesto.findOne({ where: { id, sede_id: req.sede.id } });
    if (!presupuesto) {
      throw { message: 'El presupuesto enviado no existe.' };
    }

    await presupuesto.destroy();
    return { message: 'ok' };
  },

  async renovar(id, dias, req) {
    if (!req.user) {
      throw { message: 'Sesion invalida.' };
    }

    const presupuesto = await Presupuesto.findOne({ where: { id, sede_id: req.sede.id } });
    if (!presupuesto) {
      throw { message: 'El presupuesto enviado no existe.' };
    }

    const diasRenovacion = normalizarEntero(dias, 7);
    if (!diasRenovacion || diasRenovacion < 1) {
      throw { message: 'Los días de renovación deben ser mayores a cero.' };
    }

    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const nuevaFecha = new Date(base.getTime() + (diasRenovacion * 24 * 60 * 60 * 1000));

    presupuesto.fecha_vencimiento = nuevaFecha;
    presupuesto.dias_vencimiento = diasRenovacion;
    presupuesto.estado = 'vigente';
    presupuesto.archivado_at = null;
    presupuesto.updated_by = req.user.cedula;
    await presupuesto.save();

    return {
      message: 'ok',
      presupuesto: await obtenerPresupuestoPorId(presupuesto.id, req.sede.id)
    };
  },

  async autoArchivar(dias, req) {
    if (!req.user) {
      throw { message: 'Sesion invalida.' };
    }

    const diasArchivo = normalizarEntero(dias, 30) || 30;
    if (diasArchivo < 1) {
      throw { message: 'El número de días para auto archivar debe ser mayor a cero.' };
    }

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - diasArchivo);

    const [archivados] = await Presupuesto.update({
      estado: 'archivado',
      archivado_at: new Date(),
      updated_by: req.user.cedula
    }, {
      where: {
        sede_id: req.sede.id,
        estado: { [Op.notIn]: ['archivado', 'convertido', 'anulado'] },
        fecha_vencimiento: { [Op.lt]: limite }
      }
    });

    return {
      message: 'ok',
      archivados,
      dias: diasArchivo
    };
  }
};

module.exports = PresupuestoService;