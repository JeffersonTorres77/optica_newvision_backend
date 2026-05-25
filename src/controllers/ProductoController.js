const Tasa = require('../models/Tasa');
const VerificationUtils = require('../utils/VerificationUtils');
const Producto = require('./../models/Producto');
const Categoria = require('./../models/Categoria');
const { Op } = require('sequelize');
const upload = require('../config/uploader');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ConfiguracionService = require('../services/ConfiguracionService');

const IVA_PORCENTAJE = 16;
const CATEGORIAS_COMERCIALES = ['Monturas', 'Cristales', 'Lentes de contacto', 'Líquidos', 'Estuches', 'Accesorios'];
const CRISTAL_CONFIG_START = '[NV_CRISTAL_CONFIG]';
const CRISTAL_CONFIG_END = '[/NV_CRISTAL_CONFIG]';

function normalizarTexto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarTextoNullable(valor) {
    const texto = normalizarTexto(valor);
    return texto !== '' ? texto : null;
}

function normalizarBooleanFlexible(valor) {
    return (valor === 'true' || valor === true || valor === 1 || valor === '1');
}

function normalizarCategoriaProducto(categoria) {
    const categoriaLimpia = normalizarTexto(categoria);
    const categoriaNormalizada = categoriaLimpia
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const categoriasMapeadas = {
        cristales: 'Cristales',
        lentes: 'Cristales',
        monturas: 'Monturas',
        'lentes de contacto': 'Lentes de contacto',
        liquidos: 'Líquidos',
        estuches: 'Estuches',
        accesorios: 'Accesorios',
        miscelaneos: 'Accesorios',
        miscelaneos_: 'Accesorios'
    };

    if (categoriasMapeadas[categoriaNormalizada]) {
        return categoriasMapeadas[categoriaNormalizada];
    }

    if (['filtro', 'filtros', 'aditivo', 'aditivos', 'filtro/aditivos', 'filtros/aditivos'].includes(categoriaNormalizada)) {
        return 'Filtro/Aditivos';
    }

    return categoriaLimpia;
}

function normalizarArrayTextos(valor) {
    if (!Array.isArray(valor)) {
        return [];
    }

    return Array.from(new Set(
        valor
            .map(item => normalizarTexto(item))
            .filter(Boolean)
    ));
}

function normalizarNumeroNullable(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') {
        return null;
    }

    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
        return null;
    }

    return Number(numero.toFixed(2));
}

function parseJsonObjectFlexible(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return null;
    }

    if (typeof valor === 'object' && !Array.isArray(valor)) {
        return valor;
    }

    try {
        const parsed = JSON.parse(valor);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function tieneValorInformativo(valor) {
    if (valor === null || valor === undefined) {
        return false;
    }

    if (Array.isArray(valor)) {
        return valor.some(item => tieneValorInformativo(item));
    }

    if (typeof valor === 'string') {
        return valor.trim() !== '';
    }

    if (typeof valor === 'number') {
        return Number.isFinite(valor);
    }

    if (typeof valor === 'boolean') {
        return true;
    }

    if (typeof valor === 'object') {
        return Object.values(valor).some(item => tieneValorInformativo(item));
    }

    return false;
}

function limpiarConfig(config) {
    return tieneValorInformativo(config) ? config : null;
}

function parseDescripcionCristalLegacy(descripcion) {
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

function normalizarCristalConfig(config, legacy = {}) {
    const categoria = normalizarCategoriaProducto(config?.categoria ?? legacy.categoria ?? 'Cristales');
    const marca = normalizarTexto(config?.marca ?? legacy.marca);
    const tipoCristal = normalizarTexto(config?.tipoCristal ?? config?.modelo ?? legacy.modelo);
    const presentacion = normalizarTexto(config?.presentacion ?? legacy.presentacion);
    const materialOtro = normalizarTexto(config?.materialOtro ?? legacy.materialOtro);
    const material = normalizarTexto(config?.material ?? legacy.material) || (materialOtro ? 'Otro' : '');
    const color = normalizarTextoNullable(config?.color ?? legacy.color);
    const proveedor = normalizarTexto(config?.proveedor ?? legacy.proveedor);
    const descripcion = normalizarTexto(config?.descripcion ?? legacy.descripcion);

    return {
        categoria,
        marca,
        tipoCristal,
        presentacion,
        modelo: tipoCristal,
        material,
        color,
        proveedor,
        tratamientos: normalizarArrayTextos(config?.tratamientos ?? legacy.tratamientos),
        rangoFormula: normalizarTexto(config?.rangoFormula ?? legacy.rangoFormula),
        costoLaboratorio: normalizarNumeroNullable(config?.costoLaboratorio ?? legacy.costoLaboratorio),
        materialOtro,
        descripcion
    };
}

function construirNombreCristal(config) {
    return [
        normalizarTexto(config?.tipoCristal || config?.modelo),
        normalizarTexto(config?.presentacion),
        normalizarTexto(config?.material),
        ...normalizarArrayTextos(config?.tratamientos),
        normalizarTexto(config?.rangoFormula)
    ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function construirDescripcionCristal(config) {
    const tipo = normalizarTexto(config?.tipoCristal || config?.modelo).toLowerCase();
    const presentacion = normalizarTexto(config?.presentacion).toLowerCase();
    const material = normalizarTexto(config?.material).toLowerCase();
    const tratamientos = normalizarArrayTextos(config?.tratamientos).map(item => item.toLowerCase());
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

function construirNombreSimple(...partes) {
    return partes
        .map(item => normalizarTexto(item))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function construirNombreComercialProducto(categoria, ...partes) {
    return construirNombreSimple(categoria, ...partes).toUpperCase();
}

function construirDescripcionSimple(...partes) {
    const descripcion = partes
        .map(item => normalizarTexto(item))
        .filter(Boolean)
        .join(', ')
        .replace(/\s+/g, ' ')
        .trim();

    return descripcion ? `${descripcion}.` : '';
}

function formatearClaseMontura(valor) {
    const clase = normalizarTextoNullable(valor)?.replace(/^clase\s+/i, '')?.trim();
    return clase ? `Clase ${clase}` : '';
}

function construirNombreMontura(config) {
    return construirNombreComercialProducto('Monturas', config?.marca, config?.modelo, config?.material, formatearClaseMontura(config?.clase));
}

function construirDescripcionMontura(config) {
    return construirDescripcionSimple(
        'Montura',
        construirNombreSimple(config?.marca, config?.modelo),
        config?.color ? `color ${config.color}` : '',
        config?.material ? `material ${config.material}` : '',
        config?.proveedor ? `proveedor ${config.proveedor}` : '',
        formatearClaseMontura(config?.clase)
    );
}

function construirNombreLenteContacto(config) {
    return construirNombreComercialProducto('Lentes de contacto', config?.marca, config?.tipoLenteContacto || config?.modelo, config?.material);
}

function construirDescripcionLenteContacto(config) {
    return construirDescripcionSimple(
        'Lente de contacto',
        construirNombreSimple(config?.marca, config?.tipoLenteContacto || config?.modelo),
        config?.color ? `color ${config.color}` : '',
        config?.material ? `material ${config.material}` : '',
        config?.proveedor ? `proveedor ${config.proveedor}` : '',
        config?.rangoFormula ? `rango ${config.rangoFormula}` : ''
    );
}

function construirNombreLiquido(config) {
    return construirNombreComercialProducto('Líquidos', config?.marca, config?.modelo, config?.material);
}

function construirDescripcionLiquido(config) {
    return construirDescripcionSimple(
        'Líquido',
        construirNombreSimple(config?.marca, config?.modelo),
        config?.proveedor ? `proveedor ${config.proveedor}` : ''
    );
}

function construirNombreEstuche(config) {
    return construirNombreComercialProducto('Estuches', config?.marca, config?.modelo, config?.material);
}

function construirDescripcionEstuche(config) {
    return construirDescripcionSimple(
        'Estuche',
        construirNombreSimple(config?.marca, config?.modelo),
        config?.material ? `material ${config.material}` : '',
        config?.proveedor ? `proveedor ${config.proveedor}` : ''
    );
}

function construirNombreAccesorio(config) {
    return construirNombreComercialProducto('Accesorios', config?.marca, config?.modelo, config?.material);
}

function construirDescripcionAccesorio(config) {
    return construirDescripcionSimple(
        'Accesorio',
        construirNombreSimple(config?.marca, config?.modelo),
        config?.color ? `color ${config.color}` : '',
        config?.material ? `material ${config.material}` : '',
        config?.proveedor ? `proveedor ${config.proveedor}` : ''
    );
}

function normalizarMonturaConfig(config, legacy = {}) {
    return {
        categoria: normalizarCategoriaProducto(config?.categoria ?? legacy.categoria ?? 'Monturas'),
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        clase: normalizarTextoNullable(config?.clase ?? legacy.clase),
        color: normalizarTexto(config?.color ?? legacy.color),
        material: normalizarTexto(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor),
        descripcion: normalizarTexto(config?.descripcion ?? legacy.descripcion)
    };
}

function normalizarLenteContactoConfig(config, legacy = {}) {
    return {
        categoria: normalizarCategoriaProducto(config?.categoria ?? legacy.categoria ?? 'Lentes de contacto'),
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        tipoLenteContacto: normalizarTexto(config?.tipoLenteContacto ?? legacy.modelo),
        modelo: normalizarTexto(config?.modelo ?? config?.tipoLenteContacto ?? legacy.modelo),
        color: normalizarTexto(config?.color ?? legacy.color),
        material: normalizarTextoNullable(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor),
        rangoFormula: normalizarTexto(config?.rangoFormula ?? legacy.rangoFormula),
        descripcion: normalizarTexto(config?.descripcion ?? legacy.descripcion)
    };
}

function normalizarLiquidoConfig(config, legacy = {}) {
    return {
        categoria: normalizarCategoriaProducto(config?.categoria ?? legacy.categoria ?? 'Líquidos'),
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor),
        descripcion: normalizarTexto(config?.descripcion ?? legacy.descripcion)
    };
}

function normalizarEstucheConfig(config, legacy = {}) {
    return {
        categoria: normalizarCategoriaProducto(config?.categoria ?? legacy.categoria ?? 'Estuches'),
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        material: normalizarTexto(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor),
        descripcion: normalizarTexto(config?.descripcion ?? legacy.descripcion)
    };
}

function normalizarAccesorioConfig(config, legacy = {}) {
    return {
        categoria: normalizarCategoriaProducto(config?.categoria ?? legacy.categoria ?? 'Accesorios'),
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        color: normalizarTexto(config?.color ?? legacy.color),
        material: normalizarTexto(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor),
        descripcion: normalizarTexto(config?.descripcion ?? legacy.descripcion)
    };
}

function construirNombrePorCategoria(categoria, config) {
    switch (normalizarCategoriaProducto(categoria)) {
        case 'Cristales':
            return construirNombreCristal(config);
        case 'Monturas':
            return construirNombreMontura(config);
        case 'Lentes de contacto':
            return construirNombreLenteContacto(config);
        case 'Líquidos':
            return construirNombreLiquido(config);
        case 'Estuches':
            return construirNombreEstuche(config);
        case 'Accesorios':
            return construirNombreAccesorio(config);
        default:
            return '';
    }
}

function asegurarNombreEnConfig(categoria, config, nombrePreferido) {
    if (!config) {
        return config;
    }

    const nombre = normalizarTexto(nombrePreferido)
        || normalizarTexto(config?.nombre)
        || construirNombrePorCategoria(categoria, config);

    return {
        ...config,
        nombre
    };
}

function resolverPersistenciaPorCategoria(categoria, body) {
    const cristalConfigBody = parseJsonObjectFlexible(body.cristalConfig);
    const monturaConfigBody = parseJsonObjectFlexible(body.monturaConfig);
    const lenteContactoConfigBody = parseJsonObjectFlexible(body.lenteContactoConfig);
    const liquidoConfigBody = parseJsonObjectFlexible(body.liquidoConfig);
    const estucheConfigBody = parseJsonObjectFlexible(body.estucheConfig);
    const accesorioConfigBody = parseJsonObjectFlexible(body.accesorioConfig);
    const descripcionLegacy = parseDescripcionCristalLegacy(body.descripcion);
    const legacyBase = {
        marca: body.marca,
        categoria: body.categoria,
        presentacion: body.presentacion,
        clase: body.clase,
        color: body.color,
        material: body.material,
        proveedor: body.proveedor,
        modelo: body.modelo,
        descripcion: body.descripcion,
        costoLaboratorio: body.costoLaboratorio
    };

    const basePersistencia = {
        marca: normalizarTexto(body.marca),
        color: normalizarTextoNullable(body.color),
        material: normalizarTexto(body.material),
        proveedor: normalizarTextoNullable(body.proveedor),
        modelo: normalizarTextoNullable(body.modelo),
        descripcion: normalizarTextoNullable(descripcionLegacy.descripcionUsuario || body.descripcion),
        cristal_config: null,
        montura_config: null,
        lente_contacto_config: null,
        liquido_config: null,
        estuche_config: null,
        accesorio_config: null
    };

    switch (categoria) {
        case 'Cristales': {
            const cristalConfig = limpiarConfig(normalizarCristalConfig(
                cristalConfigBody ?? descripcionLegacy.crystalConfig,
                {
                    ...legacyBase,
                    ...descripcionLegacy.crystalConfig
                }
            ));
            const nombreCristal = normalizarTexto(cristalConfigBody?.nombre ?? cristalConfig?.nombre ?? body.nombre) || construirNombreCristal(cristalConfig);
            const descripcionCristal = normalizarTextoNullable(body.descripcion || cristalConfig?.descripcion)
                || construirDescripcionCristal(cristalConfig);
            const cristalConfigPersistido = asegurarNombreEnConfig('Cristales', cristalConfig, nombreCristal);

            return {
                ...basePersistencia,
                nombre: nombreCristal,
                marca: normalizarTexto(cristalConfigPersistido?.marca ?? body.marca),
                color: null,
                material: normalizarTexto(cristalConfigPersistido?.material),
                proveedor: normalizarTextoNullable(cristalConfigPersistido?.proveedor),
                modelo: normalizarTextoNullable(cristalConfigPersistido?.tipoCristal),
                descripcion: descripcionCristal,
                cristal_config: cristalConfigPersistido
            };
        }
        case 'Monturas': {
            const monturaConfig = limpiarConfig(normalizarMonturaConfig(monturaConfigBody, legacyBase));
            const nombreMontura = normalizarTexto(monturaConfigBody?.nombre ?? monturaConfig?.nombre ?? body.nombre) || construirNombreMontura(monturaConfig);
            const descripcionMontura = normalizarTextoNullable(body.descripcion || monturaConfig?.descripcion)
                || construirDescripcionMontura(monturaConfig);
            const monturaConfigPersistido = asegurarNombreEnConfig('Monturas', monturaConfig, nombreMontura);
            return {
                ...basePersistencia,
                nombre: nombreMontura,
                marca: normalizarTexto(monturaConfigPersistido?.marca),
                color: normalizarTextoNullable(monturaConfigPersistido?.color),
                material: normalizarTexto(monturaConfigPersistido?.material),
                proveedor: normalizarTextoNullable(monturaConfigPersistido?.proveedor),
                modelo: normalizarTextoNullable(monturaConfigPersistido?.modelo),
                descripcion: descripcionMontura,
                montura_config: monturaConfigPersistido
            };
        }
        case 'Lentes de contacto': {
            const lenteContactoConfig = limpiarConfig(normalizarLenteContactoConfig(lenteContactoConfigBody, legacyBase));
            const nombreLenteContacto = normalizarTexto(lenteContactoConfigBody?.nombre ?? lenteContactoConfig?.nombre ?? body.nombre) || construirNombreLenteContacto(lenteContactoConfig);
            const descripcionLenteContacto = normalizarTextoNullable(body.descripcion || lenteContactoConfig?.descripcion)
                || construirDescripcionLenteContacto(lenteContactoConfig);
            const lenteContactoConfigPersistido = asegurarNombreEnConfig('Lentes de contacto', lenteContactoConfig, nombreLenteContacto);
            return {
                ...basePersistencia,
                nombre: nombreLenteContacto,
                marca: normalizarTexto(lenteContactoConfigPersistido?.marca),
                color: normalizarTextoNullable(lenteContactoConfigPersistido?.color),
                material: normalizarTexto(lenteContactoConfigPersistido?.material),
                proveedor: normalizarTextoNullable(lenteContactoConfigPersistido?.proveedor),
                modelo: normalizarTextoNullable(lenteContactoConfigPersistido?.tipoLenteContacto),
                descripcion: descripcionLenteContacto,
                lente_contacto_config: lenteContactoConfigPersistido
            };
        }
        case 'Líquidos': {
            const liquidoConfig = limpiarConfig(normalizarLiquidoConfig(liquidoConfigBody, legacyBase));
            const nombreLiquido = normalizarTexto(liquidoConfigBody?.nombre ?? liquidoConfig?.nombre ?? body.nombre) || construirNombreLiquido(liquidoConfig);
            const descripcionLiquido = normalizarTextoNullable(body.descripcion || liquidoConfig?.descripcion)
                || construirDescripcionLiquido(liquidoConfig);
            const liquidoConfigPersistido = asegurarNombreEnConfig('Líquidos', liquidoConfig, nombreLiquido);
            return {
                ...basePersistencia,
                nombre: nombreLiquido,
                marca: normalizarTexto(liquidoConfigPersistido?.marca),
                color: null,
                material: '',
                proveedor: normalizarTextoNullable(liquidoConfigPersistido?.proveedor),
                modelo: normalizarTextoNullable(liquidoConfigPersistido?.modelo),
                descripcion: descripcionLiquido,
                liquido_config: liquidoConfigPersistido
            };
        }
        case 'Estuches': {
            const estucheConfig = limpiarConfig(normalizarEstucheConfig(estucheConfigBody, legacyBase));
            const nombreEstuche = normalizarTexto(estucheConfigBody?.nombre ?? estucheConfig?.nombre ?? body.nombre) || construirNombreEstuche(estucheConfig);
            const descripcionEstuche = normalizarTextoNullable(body.descripcion || estucheConfig?.descripcion)
                || construirDescripcionEstuche(estucheConfig);
            const estucheConfigPersistido = asegurarNombreEnConfig('Estuches', estucheConfig, nombreEstuche);
            return {
                ...basePersistencia,
                nombre: nombreEstuche,
                marca: normalizarTexto(estucheConfigPersistido?.marca),
                color: null,
                material: normalizarTexto(estucheConfigPersistido?.material),
                proveedor: normalizarTextoNullable(estucheConfigPersistido?.proveedor),
                modelo: normalizarTextoNullable(estucheConfigPersistido?.modelo),
                descripcion: descripcionEstuche,
                estuche_config: estucheConfigPersistido
            };
        }
        case 'Accesorios': {
            const accesorioConfig = limpiarConfig(normalizarAccesorioConfig(accesorioConfigBody, legacyBase));
            const nombreAccesorio = normalizarTexto(accesorioConfigBody?.nombre ?? accesorioConfig?.nombre ?? body.nombre) || construirNombreAccesorio(accesorioConfig);
            const descripcionAccesorio = normalizarTextoNullable(body.descripcion || accesorioConfig?.descripcion)
                || construirDescripcionAccesorio(accesorioConfig);
            const accesorioConfigPersistido = asegurarNombreEnConfig('Accesorios', accesorioConfig, nombreAccesorio);
            return {
                ...basePersistencia,
                nombre: nombreAccesorio,
                marca: normalizarTexto(accesorioConfigPersistido?.marca),
                color: normalizarTextoNullable(accesorioConfigPersistido?.color),
                material: normalizarTexto(accesorioConfigPersistido?.material),
                proveedor: normalizarTextoNullable(accesorioConfigPersistido?.proveedor),
                modelo: normalizarTextoNullable(accesorioConfigPersistido?.modelo),
                descripcion: descripcionAccesorio,
                accesorio_config: accesorioConfigPersistido
            };
        }
        default:
            return basePersistencia;
    }
}

function resolverCategoriaDesdeBody(body) {
    const cristalConfigBody = parseJsonObjectFlexible(body.cristalConfig);
    const monturaConfigBody = parseJsonObjectFlexible(body.monturaConfig);
    const lenteContactoConfigBody = parseJsonObjectFlexible(body.lenteContactoConfig);
    const liquidoConfigBody = parseJsonObjectFlexible(body.liquidoConfig);
    const estucheConfigBody = parseJsonObjectFlexible(body.estucheConfig);
    const accesorioConfigBody = parseJsonObjectFlexible(body.accesorioConfig);

    return normalizarCategoriaProducto(
        body.categoria
        || cristalConfigBody?.categoria
        || monturaConfigBody?.categoria
        || lenteContactoConfigBody?.categoria
        || liquidoConfigBody?.categoria
        || estucheConfigBody?.categoria
        || accesorioConfigBody?.categoria
    );
}

function normalizarBooleanDesdeEntrada(valor) {
    if (typeof valor === 'boolean') {
        return valor;
    }

    if (typeof valor === 'number') {
        if (valor === 1) {
            return true;
        }

        if (valor === 0) {
            return false;
        }
    }

    const texto = normalizarTexto(String(valor ?? '')).toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes'].includes(texto)) {
        return true;
    }

    if (['false', '0', 'no'].includes(texto)) {
        return false;
    }

    return null;
}

function normalizarNumeroDesdeEntrada(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') {
        return null;
    }

    let normalizado = String(valor).trim().replace(/[^\d,.-]/g, '');
    const ultimoPunto = normalizado.lastIndexOf('.');
    const ultimaComa = normalizado.lastIndexOf(',');

    if (ultimoPunto !== -1 && ultimaComa !== -1) {
        if (ultimoPunto > ultimaComa) {
            normalizado = normalizado.replace(/,/g, '');
        } else {
            normalizado = normalizado.replace(/\./g, '').replace(',', '.');
        }
    } else if (ultimaComa !== -1) {
        normalizado = normalizado.replace(',', '.');
    }

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
}

function construirClaveDuplicadoProducto({ nombre, marca, color, categoria }) {
    return JSON.stringify({
        nombre: normalizarTexto(nombre).toLowerCase(),
        marca: normalizarTexto(marca).toLowerCase(),
        color: normalizarTexto(color).toLowerCase(),
        categoria: normalizarTexto(categoria).toLowerCase()
    });
}

async function validarProductoParaPersistencia({ body, sedeId, productoActual = null }) {
    const {
        nombre,
        stock,
        precio,
        requiere_formula: requiereFormulaPar,
        requiere_item_padre: requiereItemPadrePar,
        activo: activoPar,
        aplicaIva: aplicaIvaPar
    } = body;

    const activo = normalizarBooleanDesdeEntrada(activoPar);
    const aplicaIva = normalizarBooleanDesdeEntrada(aplicaIvaPar);
    const requiereFormula = normalizarBooleanDesdeEntrada(requiereFormulaPar);
    const requiereItemPadre = normalizarBooleanDesdeEntrada(requiereItemPadrePar ?? false);
    const categoriaNormalizada = resolverCategoriaDesdeBody(body);
    const datosCategoria = resolverPersistenciaPorCategoria(categoriaNormalizada, body);
    const nombreProducto = normalizarTexto(nombre) || datosCategoria.nombre;
    const stockNumber = normalizarNumeroDesdeEntrada(stock);
    const precioNumber = normalizarNumeroDesdeEntrada(precio);

    if (!VerificationUtils.verify_nombre(nombreProducto)) {
        throw { status: 400, message: 'El nombre no puede quedar vacio.' };
    }
    if (!VerificationUtils.verify_nombre(categoriaNormalizada)) {
        throw { status: 400, message: 'La categoria no puede quedar vacio.' };
    }
    if (!VerificationUtils.verify_numero(stockNumber) || stockNumber < 0) {
        throw { status: 400, message: 'El stock debe ser numerico y mayor o igual a cero.' };
    }
    if (!VerificationUtils.verify_numero(precioNumber) || precioNumber < 0) {
        throw { status: 400, message: 'El precio debe ser numerico y mayor o igual a cero.' };
    }
    if (!VerificationUtils.verify_boolean(activo)) {
        throw { status: 400, message: "El parametro 'activo' debe ser booleano." };
    }
    if (!VerificationUtils.verify_boolean(aplicaIva)) {
        throw { status: 400, message: "El parametro 'aplicaIva' debe ser booleano." };
    }
    if (!VerificationUtils.verify_boolean(requiereFormula)) {
        throw { status: 400, message: "El parametro 'requiere_formula' debe ser booleano." };
    }
    if (!VerificationUtils.verify_boolean(requiereItemPadre)) {
        throw { status: 400, message: "El parametro 'requiere_item_padre' debe ser booleano." };
    }
    if (!CATEGORIAS_COMERCIALES.includes(categoriaNormalizada)) {
        throw { status: 400, message: 'La categoria enviada no forma parte del contrato comercial actual.' };
    }

    const monedaBase = await ConfiguracionService.get_moneda_base(sedeId);
    const objTasa = await Tasa.findOne({ where: { id: monedaBase.valor } });
    if (!objTasa) {
        throw { status: 400, message: 'La moneda enviada no existe: ' + monedaBase.valor + '.' };
    }

    const whereDuplicado = {
        sede_id: sedeId,
        nombre: nombreProducto,
        marca: datosCategoria.marca,
        color: datosCategoria.color,
        categoria: categoriaNormalizada
    };

    if (productoActual?.id) {
        whereDuplicado.id = { [Op.ne]: productoActual.id };
    }

    const productoDuplicado = await Producto.findOne({ where: whereDuplicado });

    let precioSinIva = Number(precioNumber);
    if (aplicaIva) {
        precioSinIva = Number(precioNumber * (100 / 116));
    }

    return {
        objTasa,
        categoriaNormalizada,
        datosCategoria,
        nombreProducto,
        stockNumber: Math.trunc(stockNumber),
        precioNumber: Number(precioNumber.toFixed(2)),
        precioSinIva: Number(precioSinIva.toFixed(2)),
        activo,
        aplicaIva,
        requiereFormula,
        requiereItemPadre,
        productoDuplicado
    };
}

async function persistirProducto({ body, sedeId, productoActual = null, permitirSumarStockDuplicado = false }) {
    const validacion = await validarProductoParaPersistencia({ body, sedeId, productoActual });

    if (validacion.productoDuplicado && !permitirSumarStockDuplicado) {
        throw { status: 400, message: 'Ya existe un producto con el mismo nombre, marca, color y categoria en la sede actual.' };
    }

    const productoDestino = validacion.productoDuplicado || productoActual || Producto.build({
        sede_id: sedeId,
        codigo: null,
        imagen_url: '/public/images/product-generic-image.jpg?t=' + Date.now()
    });
    const esNuevo = !productoDestino.id;

    productoDestino.sede_id = sedeId;
    productoDestino.nombre = validacion.nombreProducto;
    productoDestino.marca = validacion.datosCategoria.marca;
    productoDestino.color = validacion.datosCategoria.color;
    productoDestino.material = validacion.datosCategoria.material;
    productoDestino.proveedor = validacion.datosCategoria.proveedor;
    productoDestino.categoria = validacion.categoriaNormalizada;
    productoDestino.modelo = validacion.datosCategoria.modelo;
    productoDestino.stock = validacion.productoDuplicado && permitirSumarStockDuplicado
        ? Number(productoDestino.stock ?? 0) + validacion.stockNumber
        : validacion.stockNumber;
    productoDestino.precio = validacion.precioSinIva;
    productoDestino.aplica_iva = validacion.aplicaIva;
    productoDestino.precio_con_iva = validacion.precioNumber;
    productoDestino.moneda = validacion.objTasa.id;
    productoDestino.activo = validacion.activo;
    productoDestino.descripcion = validacion.datosCategoria.descripcion;
    productoDestino.cristal_config = validacion.datosCategoria.cristal_config;
    productoDestino.montura_config = validacion.datosCategoria.montura_config;
    productoDestino.lente_contacto_config = validacion.datosCategoria.lente_contacto_config;
    productoDestino.liquido_config = validacion.datosCategoria.liquido_config;
    productoDestino.estuche_config = validacion.datosCategoria.estuche_config;
    productoDestino.accesorio_config = validacion.datosCategoria.accesorio_config;
    productoDestino.requiere_formula = validacion.requiereFormula;
    productoDestino.requiere_item_padre = validacion.requiereItemPadre;

    await productoDestino.save();

    if (esNuevo) {
        productoDestino.codigo = `PR-${productoDestino.id.toString().padStart(6, '0')}`;
        await productoDestino.save();
    }

    return {
        producto: productoDestino,
        accion: validacion.productoDuplicado && permitirSumarStockDuplicado
            ? 'stock_sumado'
            : esNuevo
                ? 'creado'
                : 'actualizado',
        duplicadoDetectado: Boolean(validacion.productoDuplicado)
    };
}

function construirPayloadImportacionDesdeFila(fila = {}) {
    const categoria = normalizarCategoriaProducto(fila.categoria);
    const tratamientosTexto = normalizarTexto(fila.tratamientos);
    const tratamientos = tratamientosTexto
        ? tratamientosTexto.split('|').map(item => normalizarTexto(item)).filter(Boolean)
        : [];
    const material = normalizarTexto(fila.material).replace(/\bcr-?39\b/i, 'CR39');
    const materialOtro = normalizarTexto(fila.material_otro);
    const nombrePersonalizado = normalizarTexto(fila.nombre_personalizado);
    const descripcionPersonalizada = normalizarTexto(fila.descripcion_personalizada);
    const proveedor = normalizarTexto(fila.proveedor);
    const modelo = normalizarTexto(fila.modelo);
    const marca = normalizarTexto(fila.marca);
    const color = normalizarTexto(fila.color);
    const tipoCristal = normalizarTexto(fila.tipo_cristal);
    const tipoLenteContacto = normalizarTexto(fila.tipo_lente_contacto || fila.tipo_lente);

    const body = {
        categoria,
        nombre: nombrePersonalizado,
        descripcion: descripcionPersonalizada,
        stock: fila.stock,
        precio: fila.precio_venta,
        aplicaIva: tieneValorInformativo(fila.aplica_iva) ? fila.aplica_iva : false,
        requiere_formula: tieneValorInformativo(fila.requiere_formula) ? fila.requiere_formula : false,
        requiere_item_padre: false,
        activo: tieneValorInformativo(fila.activo) ? fila.activo : true
    };

    switch (categoria) {
        case 'Cristales':
            body.cristalConfig = JSON.stringify({
                categoria: 'Cristales',
                nombre: nombrePersonalizado || null,
                marca,
                tipoCristal,
                presentacion: normalizarTexto(fila.presentacion),
                modelo: tipoCristal,
                material: materialOtro ? 'Otro' : material,
                color: null,
                proveedor,
                tratamientos,
                rangoFormula: normalizarTexto(fila.rango_formula),
                costoLaboratorio: normalizarNumeroDesdeEntrada(fila.costo_laboratorio),
                materialOtro,
                descripcion: descripcionPersonalizada || null
            });
            break;
        case 'Monturas':
            body.monturaConfig = JSON.stringify({
                categoria: 'Monturas',
                nombre: nombrePersonalizado || null,
                marca,
                modelo,
                clase: normalizarTexto(fila.clase),
                color,
                material,
                proveedor,
                descripcion: descripcionPersonalizada || null
            });
            break;
        case 'Lentes de contacto':
            body.lenteContactoConfig = JSON.stringify({
                categoria: 'Lentes de contacto',
                nombre: nombrePersonalizado || null,
                marca,
                tipoLenteContacto,
                modelo: modelo || tipoLenteContacto,
                color,
                material: material || null,
                proveedor,
                rangoFormula: normalizarTexto(fila.rango_formula),
                descripcion: descripcionPersonalizada || null
            });
            break;
        case 'Líquidos':
            body.liquidoConfig = JSON.stringify({
                categoria: 'Líquidos',
                nombre: nombrePersonalizado || null,
                marca,
                modelo,
                proveedor,
                descripcion: descripcionPersonalizada || null
            });
            break;
        case 'Estuches':
            body.estucheConfig = JSON.stringify({
                categoria: 'Estuches',
                nombre: nombrePersonalizado || null,
                marca,
                modelo,
                material,
                proveedor,
                descripcion: descripcionPersonalizada || null
            });
            break;
        case 'Accesorios':
            body.accesorioConfig = JSON.stringify({
                categoria: 'Accesorios',
                nombre: nombrePersonalizado || null,
                marca,
                modelo,
                color,
                material,
                proveedor,
                descripcion: descripcionPersonalizada || null
            });
            break;
        default:
            break;
    }

    return body;
}

function construirBloquesConfigProducto(producto) {
    const descripcionLegacy = parseDescripcionCristalLegacy(producto.descripcion);
    const legacyBase = {
        categoria: producto.categoria,
        marca: producto.marca,
        color: producto.color,
        material: producto.material,
        proveedor: producto.proveedor,
        modelo: producto.modelo,
        descripcion: producto.descripcion
    };

    switch (normalizarCategoriaProducto(producto.categoria)) {
        case 'Cristales': {
            const legacyCristal = {
                ...legacyBase,
                marca: producto?.cristal_config?.marca ?? descripcionLegacy?.crystalConfig?.marca ?? '',
                presentacion: producto?.cristal_config?.presentacion ?? descripcionLegacy?.crystalConfig?.presentacion ?? producto.marca
            };
            const cristalConfig = limpiarConfig(normalizarCristalConfig(
                producto.cristal_config ?? descripcionLegacy.crystalConfig,
                {
                    ...legacyCristal,
                    ...descripcionLegacy.crystalConfig
                }
            ));
            return {
                cristalConfig: asegurarNombreEnConfig('Cristales', cristalConfig, producto?.nombre)
            };
        }
        case 'Monturas':
            return {
                monturaConfig: asegurarNombreEnConfig('Monturas', limpiarConfig(normalizarMonturaConfig(producto.montura_config, legacyBase)), producto?.nombre)
            };
        case 'Lentes de contacto':
            return {
                lenteContactoConfig: asegurarNombreEnConfig('Lentes de contacto', limpiarConfig(normalizarLenteContactoConfig(producto.lente_contacto_config, legacyBase)), producto?.nombre)
            };
        case 'Líquidos':
            return {
                liquidoConfig: asegurarNombreEnConfig('Líquidos', limpiarConfig(normalizarLiquidoConfig(producto.liquido_config, legacyBase)), producto?.nombre)
            };
        case 'Estuches':
            return {
                estucheConfig: asegurarNombreEnConfig('Estuches', limpiarConfig(normalizarEstucheConfig(producto.estuche_config, legacyBase)), producto?.nombre)
            };
        case 'Accesorios':
            return {
                accesorioConfig: asegurarNombreEnConfig('Accesorios', limpiarConfig(normalizarAccesorioConfig(producto.accesorio_config, legacyBase)), producto?.nombre)
            };
        default:
            return {};
    }
}

function construirProductoOutput(producto, imagenUrl) {
    const descripcionLegacy = parseDescripcionCristalLegacy(producto.descripcion);
    const categoriaNormalizada = normalizarCategoriaProducto(producto.categoria);
    const bloquesConfig = construirBloquesConfigProducto(producto);

    if (categoriaNormalizada === 'Cristales') {
        const cristalConfig = asegurarNombreEnConfig('Cristales', bloquesConfig.cristalConfig || {}, producto?.nombre) || {};
        const descripcionCristal = normalizarTexto(cristalConfig.descripcion)
            || normalizarTexto(descripcionLegacy.descripcionUsuario)
            || construirDescripcionCristal(cristalConfig);

        return {
            id: producto.id,
            sede_id: producto.sede_id,
            codigo: producto.codigo,
            stock: Number(producto.stock ?? 0),
            precio: Number(producto.precio ?? 0),
            aplicaIva: producto.aplica_iva,
            precioConIva: Number(producto.precio_con_iva ?? 0),
            costoLaboratorio: normalizarNumeroNullable(cristalConfig.costoLaboratorio),
            moneda: producto.moneda,
            activo: producto.activo,
            imagen_url: imagenUrl ?? producto.imagen_url,
            created_at: producto.created_at,
            updated_at: producto.updated_at,
            requiere_formula: producto.requiere_formula,
            cristalConfig: {
                categoria: 'Cristales',
                nombre: normalizarTextoNullable(cristalConfig.nombre),
                marca: normalizarTextoNullable(cristalConfig.marca),
                tipoCristal: normalizarTextoNullable(cristalConfig.tipoCristal ?? cristalConfig.modelo),
                presentacion: normalizarTextoNullable(cristalConfig.presentacion),
                modelo: normalizarTextoNullable(cristalConfig.modelo ?? cristalConfig.tipoCristal),
                material: normalizarTextoNullable(cristalConfig.material),
                color: cristalConfig.color ?? null,
                proveedor: normalizarTextoNullable(cristalConfig.proveedor),
                tratamientos: normalizarArrayTextos(cristalConfig.tratamientos),
                rangoFormula: normalizarTextoNullable(cristalConfig.rangoFormula),
                materialOtro: normalizarTextoNullable(cristalConfig.materialOtro) ?? '',
                descripcion: descripcionCristal
            }
        };
    }

    const baseOutput = {
        id: producto.id,
        sede_id: producto.sede_id,
        codigo: producto.codigo,
        stock: Number(producto.stock ?? 0),
        precio: Number(producto.precio ?? 0),
        aplicaIva: producto.aplica_iva,
        precioConIva: Number(producto.precio_con_iva ?? 0),
        moneda: producto.moneda,
        activo: producto.activo,
        descripcion: normalizarTextoNullable(descripcionLegacy.descripcionUsuario),
        imagen_url: imagenUrl ?? producto.imagen_url,
        created_at: producto.created_at,
        updated_at: producto.updated_at,
        requiere_formula: producto.requiere_formula
    };

    switch (categoriaNormalizada) {
        case 'Monturas': {
            const monturaConfig = asegurarNombreEnConfig('Monturas', bloquesConfig.monturaConfig || {}, producto?.nombre) || {};
            return {
                ...baseOutput,
                monturaConfig: {
                    categoria: 'Monturas',
                    nombre: normalizarTextoNullable(monturaConfig.nombre),
                    marca: normalizarTextoNullable(monturaConfig.marca),
                    modelo: normalizarTextoNullable(monturaConfig.modelo),
                    clase: normalizarTextoNullable(monturaConfig.clase),
                    color: normalizarTextoNullable(monturaConfig.color),
                    material: normalizarTextoNullable(monturaConfig.material),
                    proveedor: normalizarTextoNullable(monturaConfig.proveedor),
                    descripcion: normalizarTextoNullable(monturaConfig.descripcion)
                }
            };
        }
        case 'Lentes de contacto': {
            const lenteContactoConfig = asegurarNombreEnConfig('Lentes de contacto', bloquesConfig.lenteContactoConfig || {}, producto?.nombre) || {};
            return {
                ...baseOutput,
                lenteContactoConfig: {
                    categoria: 'Lentes de contacto',
                    nombre: normalizarTextoNullable(lenteContactoConfig.nombre),
                    marca: normalizarTextoNullable(lenteContactoConfig.marca),
                    tipoLenteContacto: normalizarTextoNullable(lenteContactoConfig.tipoLenteContacto ?? lenteContactoConfig.modelo),
                    modelo: normalizarTextoNullable(lenteContactoConfig.modelo ?? lenteContactoConfig.tipoLenteContacto),
                    color: normalizarTextoNullable(lenteContactoConfig.color),
                    material: lenteContactoConfig.material ?? null,
                    proveedor: normalizarTextoNullable(lenteContactoConfig.proveedor),
                    rangoFormula: normalizarTextoNullable(lenteContactoConfig.rangoFormula),
                    descripcion: normalizarTextoNullable(lenteContactoConfig.descripcion)
                }
            };
        }
        case 'Líquidos': {
            const liquidoConfig = asegurarNombreEnConfig('Líquidos', bloquesConfig.liquidoConfig || {}, producto?.nombre) || {};
            return {
                ...baseOutput,
                liquidoConfig: {
                    categoria: 'Líquidos',
                    nombre: normalizarTextoNullable(liquidoConfig.nombre),
                    marca: normalizarTextoNullable(liquidoConfig.marca),
                    modelo: normalizarTextoNullable(liquidoConfig.modelo),
                    proveedor: normalizarTextoNullable(liquidoConfig.proveedor),
                    descripcion: normalizarTextoNullable(liquidoConfig.descripcion)
                }
            };
        }
        case 'Estuches': {
            const estucheConfig = asegurarNombreEnConfig('Estuches', bloquesConfig.estucheConfig || {}, producto?.nombre) || {};
            return {
                ...baseOutput,
                estucheConfig: {
                    categoria: 'Estuches',
                    nombre: normalizarTextoNullable(estucheConfig.nombre),
                    marca: normalizarTextoNullable(estucheConfig.marca),
                    modelo: normalizarTextoNullable(estucheConfig.modelo),
                    material: normalizarTextoNullable(estucheConfig.material),
                    proveedor: normalizarTextoNullable(estucheConfig.proveedor),
                    descripcion: normalizarTextoNullable(estucheConfig.descripcion)
                }
            };
        }
        case 'Accesorios': {
            const accesorioConfig = asegurarNombreEnConfig('Accesorios', bloquesConfig.accesorioConfig || {}, producto?.nombre) || {};
            return {
                ...baseOutput,
                accesorioConfig: {
                    categoria: 'Accesorios',
                    nombre: normalizarTextoNullable(accesorioConfig.nombre),
                    marca: normalizarTextoNullable(accesorioConfig.marca),
                    modelo: normalizarTextoNullable(accesorioConfig.modelo),
                    color: normalizarTextoNullable(accesorioConfig.color),
                    material: normalizarTextoNullable(accesorioConfig.material),
                    proveedor: normalizarTextoNullable(accesorioConfig.proveedor),
                    descripcion: normalizarTextoNullable(accesorioConfig.descripcion)
                }
            };
        }
        default:
            return baseOutput;
    }
}

const ProductoController = {
    add: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        req.nombre_imagen = `product-${Date.now()}`;
        upload.single('imagen')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(400).json({ message: err.message });
                } else if (err) {
                    return res.status(400).json({ message: err.message });
                }
            }

            let resultadoPersistencia;

            try {
                resultadoPersistencia = await persistirProducto({
                    body: req.body,
                    sedeId: req.sede.id
                });
            } catch (error) {
                return res.status(error.status || 400).json({ message: error.message || 'No se pudo registrar el producto.' });
            }

            const objProducto = resultadoPersistencia.producto;

            const producto = objProducto.get({ plain: true });
            const producto_output = construirProductoOutput(producto);

            if (req.file) {
                // Renombra el archivo subido con el ID del producto
                const extension = path.extname(req.file.filename);
                const nuevoNombre = `product-${objProducto.id}${extension}`;
                const oldPath = path.join("./public/images", req.nombre_imagen + extension);
                const newPath = path.join("./public/images", nuevoNombre);

                // Renombra el archivo en el sistema de archivos
                fs.renameSync(oldPath, newPath);

                // Actualiza la URL de la imagen en el producto
                objProducto.imagen_url = `/public/images/${nuevoNombre}?t=${Date.now()}`;
                await objProducto.save();
                producto_output.imagen_url = objProducto.imagen_url;
            }
            
            res.status(200).json({ message: 'ok', iva: IVA_PORCENTAJE, producto: producto_output });
        });
    },

    remove_image: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const producto_id = req.params.id;

        const objProducto = await Producto.findOne({ where: { id: producto_id } });
        if (!objProducto) {
            throw { message: "Producto no existe." };
        }
        if (objProducto.sede_id != req.sede.id) {
            throw { message: "No se puede modificar productos de otras sedes." };
        }

        objProducto.imagen_url = null;
        await objProducto.save();

        res.status(200).json({ message: 'ok' });
    },

    update: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;
        const objProducto = await Producto.findOne({ where: { id: id } });
        if (!objProducto) {
            throw { message: "El producto enviado no existe." };
        }
        if (objProducto.sede_id != req.sede.id) {
            throw { message: "No se puede modificar productos de otras sedes." };
        }

        req.nombre_imagen = `product-${Date.now()}`;
        upload.single('imagen')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(400).json({ message: err.message });
                } else if (err) {
                    return res.status(400).json({ message: err.message });
                }
            }
            let resultadoPersistencia;

            try {
                resultadoPersistencia = await persistirProducto({
                    body: req.body,
                    sedeId: req.sede.id,
                    productoActual: objProducto
                });
            } catch (error) {
                return res.status(error.status || 400).json({ message: error.message || 'No se pudo actualizar el producto.' });
            }

            const productoActualizado = resultadoPersistencia.producto;

            const producto = productoActualizado.get({ plain: true });
            const producto_output = construirProductoOutput(producto);

            if (req.file) {
                // Renombra el archivo subido con el ID del producto
                const extension = path.extname(req.file.filename);
                const nuevoNombre = `product-${productoActualizado.id}${extension}`;
                const oldPath = path.join("./public/images", req.nombre_imagen + extension);
                const newPath = path.join("./public/images", nuevoNombre);

                // Renombra el archivo en el sistema de archivos
                fs.renameSync(oldPath, newPath);

                // Actualiza la URL de la imagen en el producto
                productoActualizado.imagen_url = `/public/images/${nuevoNombre}?t=${Date.now()}`;
                await productoActualizado.save();
                producto_output.imagen_url = productoActualizado.imagen_url;
            }

            res.status(200).json({ message: 'ok', iva: IVA_PORCENTAJE, producto: producto_output });
        });
    },

    import_massive: async (req, res) => {
        if (!req.user) {
            throw { message: 'Sesion invalida.' };
        }

        const filas = Array.isArray(req.body?.productos) ? req.body.productos : [];
        if (filas.length === 0) {
            return res.status(400).json({ message: 'Debe enviar al menos un producto para importar.' });
        }

        const resultados = [];
        const duplicadosProcesados = new Map();

        for (let index = 0; index < filas.length; index += 1) {
            const fila = filas[index] || {};
            const numeroFila = Number(fila.__rowNum__ ?? index + 2);

            try {
                const body = construirPayloadImportacionDesdeFila(fila);
                const validacion = await validarProductoParaPersistencia({
                    body,
                    sedeId: req.sede.id
                });
                const claveDuplicado = construirClaveDuplicadoProducto({
                    nombre: validacion.nombreProducto,
                    marca: validacion.datosCategoria.marca,
                    color: validacion.datosCategoria.color,
                    categoria: validacion.categoriaNormalizada
                });

                if (duplicadosProcesados.has(claveDuplicado)) {
                    throw {
                        status: 400,
                        message: `La fila duplica otra fila del mismo archivo para '${validacion.nombreProducto}'. Unifique el stock antes de importar.`
                    };
                }

                duplicadosProcesados.set(claveDuplicado, numeroFila);

                const resultado = await persistirProducto({
                    body,
                    sedeId: req.sede.id,
                    permitirSumarStockDuplicado: true
                });

                resultados.push({
                    fila: numeroFila,
                    accion: resultado.accion,
                    codigo: resultado.producto.codigo,
                    nombre: resultado.producto.nombre,
                    stock: Number(resultado.producto.stock ?? 0),
                    message: resultado.accion === 'stock_sumado'
                        ? 'Producto existente detectado. Se sumo el stock al inventario actual.'
                        : resultado.accion === 'creado'
                            ? 'Producto creado correctamente.'
                            : 'Producto actualizado correctamente.'
                });
            } catch (error) {
                resultados.push({
                    fila: numeroFila,
                    accion: 'error',
                    message: error.message || 'No se pudo importar la fila.'
                });
            }
        }

        const resumen = resultados.reduce((acc, item) => {
            if (item.accion === 'creado') {
                acc.creados += 1;
            } else if (item.accion === 'stock_sumado') {
                acc.stockActualizado += 1;
            } else if (item.accion === 'actualizado') {
                acc.actualizados += 1;
            } else {
                acc.errores += 1;
            }

            return acc;
        }, { total: filas.length, creados: 0, stockActualizado: 0, actualizados: 0, errores: 0 });

        res.status(200).json({
            message: 'ok',
            resumen,
            resultados
        });
    },

    get: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const producto_id = req.params.id;
        let productos_db = [];

        if (producto_id) {
            productos_db = await Producto.findAll({
                where: { id: producto_id }
            });
        } else {
            productos_db = await Producto.findAll({});
        }

        let productos_output = [];
        for (let producto of productos_db) {
            const productoPlano = typeof producto?.get === 'function' ? producto.get({ plain: true }) : producto;
            const existe_imagen = (producto.imagen_url !== null && limpiarYValidarRuta(producto.imagen_url));
            const ruta_imagen = (existe_imagen) ? (producto.imagen_url) : ("/public/images/product-generic-image.jpg?t=" + Date.now());

            productos_output.push(construirProductoOutput(productoPlano, ruta_imagen));
        }

        res.status(200).json({ message: 'ok', iva: IVA_PORCENTAJE, productos: productos_output });
    },

    get_categorias: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const categorias_db = await Categoria.findAll({});
        const idsPorNombre = new Map();

        categorias_db.forEach(categoria => {
            const nombreNormalizado = normalizarCategoriaProducto(categoria.nombre);
            if (!idsPorNombre.has(nombreNormalizado)) {
                idsPorNombre.set(nombreNormalizado, categoria.id);
            }
        });

        const categorias_output = CATEGORIAS_COMERCIALES.map((nombre, index) => ({
            id: idsPorNombre.get(nombre) ?? index + 1,
            nombre
        }));

        res.status(200).json({ message: 'ok', categorias: categorias_output });
    },

    delete: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const producto_id = req.params.id;

        const producto = await Producto.findOne({ where: { id: producto_id } });
        if (!producto) {
            throw { message: "Producto no existe." };
        }
        if (producto.sede_id != req.sede.id) {
            throw { message: "No se puede eliminar productos de otras sedes." };
        }
        await producto.destroy();

        res.status(200).json({ message: 'ok' });
    },
};

function limpiarYValidarRuta(inputUrl, baseDir = __dirname) {
  // Elimina el query string si existe
  const rutaSinQuery = inputUrl.split('?')[0];

  // Construye la ruta absoluta del archivo
  const rutaAbsoluta = path.join(__dirname + "/../..", rutaSinQuery);

  // Verifica si el archivo existe
  const existeArchivo = fs.existsSync(rutaAbsoluta);

  return existeArchivo;
}

module.exports = ProductoController;