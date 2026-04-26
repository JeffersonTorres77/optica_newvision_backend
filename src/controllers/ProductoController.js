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

function construirNombreMontura(config) {
    return construirNombreComercialProducto('Monturas', config?.marca, config?.modelo, config?.material);
}

function construirDescripcionMontura(config) {
    return construirDescripcionSimple(
        'Montura',
        construirNombreSimple(config?.marca, config?.modelo),
        config?.color ? `color ${config.color}` : '',
        config?.material ? `material ${config.material}` : '',
        config?.proveedor ? `proveedor ${config.proveedor}` : ''
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
            const nombreCristal = normalizarTexto(body.nombre) || construirNombreCristal(cristalConfig);
            const descripcionCristal = normalizarTextoNullable(body.descripcion || cristalConfig?.descripcion)
                || construirDescripcionCristal(cristalConfig);

            return {
                ...basePersistencia,
                nombre: nombreCristal,
                marca: normalizarTexto(cristalConfig?.marca ?? body.marca),
                color: null,
                material: normalizarTexto(cristalConfig?.material),
                proveedor: normalizarTextoNullable(cristalConfig?.proveedor),
                modelo: normalizarTextoNullable(cristalConfig?.tipoCristal),
                descripcion: descripcionCristal,
                cristal_config: cristalConfig
            };
        }
        case 'Monturas': {
            const monturaConfig = limpiarConfig(normalizarMonturaConfig(monturaConfigBody, legacyBase));
            const nombreMontura = normalizarTexto(body.nombre) || construirNombreMontura(monturaConfig);
            const descripcionMontura = normalizarTextoNullable(body.descripcion || monturaConfig?.descripcion)
                || construirDescripcionMontura(monturaConfig);
            return {
                ...basePersistencia,
                nombre: nombreMontura,
                marca: normalizarTexto(monturaConfig?.marca),
                color: normalizarTextoNullable(monturaConfig?.color),
                material: normalizarTexto(monturaConfig?.material),
                proveedor: normalizarTextoNullable(monturaConfig?.proveedor),
                modelo: normalizarTextoNullable(monturaConfig?.modelo),
                descripcion: descripcionMontura,
                montura_config: monturaConfig
            };
        }
        case 'Lentes de contacto': {
            const lenteContactoConfig = limpiarConfig(normalizarLenteContactoConfig(lenteContactoConfigBody, legacyBase));
            const nombreLenteContacto = normalizarTexto(body.nombre) || construirNombreLenteContacto(lenteContactoConfig);
            const descripcionLenteContacto = normalizarTextoNullable(body.descripcion || lenteContactoConfig?.descripcion)
                || construirDescripcionLenteContacto(lenteContactoConfig);
            return {
                ...basePersistencia,
                nombre: nombreLenteContacto,
                marca: normalizarTexto(lenteContactoConfig?.marca),
                color: normalizarTextoNullable(lenteContactoConfig?.color),
                material: normalizarTexto(lenteContactoConfig?.material),
                proveedor: normalizarTextoNullable(lenteContactoConfig?.proveedor),
                modelo: normalizarTextoNullable(lenteContactoConfig?.tipoLenteContacto),
                descripcion: descripcionLenteContacto,
                lente_contacto_config: lenteContactoConfig
            };
        }
        case 'Líquidos': {
            const liquidoConfig = limpiarConfig(normalizarLiquidoConfig(liquidoConfigBody, legacyBase));
            const nombreLiquido = normalizarTexto(body.nombre) || construirNombreLiquido(liquidoConfig);
            const descripcionLiquido = normalizarTextoNullable(body.descripcion || liquidoConfig?.descripcion)
                || construirDescripcionLiquido(liquidoConfig);
            return {
                ...basePersistencia,
                nombre: nombreLiquido,
                marca: normalizarTexto(liquidoConfig?.marca),
                color: null,
                material: '',
                proveedor: normalizarTextoNullable(liquidoConfig?.proveedor),
                modelo: normalizarTextoNullable(liquidoConfig?.modelo),
                descripcion: descripcionLiquido,
                liquido_config: liquidoConfig
            };
        }
        case 'Estuches': {
            const estucheConfig = limpiarConfig(normalizarEstucheConfig(estucheConfigBody, legacyBase));
            const nombreEstuche = normalizarTexto(body.nombre) || construirNombreEstuche(estucheConfig);
            const descripcionEstuche = normalizarTextoNullable(body.descripcion || estucheConfig?.descripcion)
                || construirDescripcionEstuche(estucheConfig);
            return {
                ...basePersistencia,
                nombre: nombreEstuche,
                marca: normalizarTexto(estucheConfig?.marca),
                color: null,
                material: normalizarTexto(estucheConfig?.material),
                proveedor: normalizarTextoNullable(estucheConfig?.proveedor),
                modelo: normalizarTextoNullable(estucheConfig?.modelo),
                descripcion: descripcionEstuche,
                estuche_config: estucheConfig
            };
        }
        case 'Accesorios': {
            const accesorioConfig = limpiarConfig(normalizarAccesorioConfig(accesorioConfigBody, legacyBase));
            const nombreAccesorio = normalizarTexto(body.nombre) || construirNombreAccesorio(accesorioConfig);
            const descripcionAccesorio = normalizarTextoNullable(body.descripcion || accesorioConfig?.descripcion)
                || construirDescripcionAccesorio(accesorioConfig);
            return {
                ...basePersistencia,
                nombre: nombreAccesorio,
                marca: normalizarTexto(accesorioConfig?.marca),
                color: normalizarTextoNullable(accesorioConfig?.color),
                material: normalizarTexto(accesorioConfig?.material),
                proveedor: normalizarTextoNullable(accesorioConfig?.proveedor),
                modelo: normalizarTextoNullable(accesorioConfig?.modelo),
                descripcion: descripcionAccesorio,
                accesorio_config: accesorioConfig
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
            return {
                cristalConfig: limpiarConfig(normalizarCristalConfig(
                    producto.cristal_config ?? descripcionLegacy.crystalConfig,
                    {
                        ...legacyCristal,
                        ...descripcionLegacy.crystalConfig
                    }
                ))
            };
        }
        case 'Monturas':
            return {
                monturaConfig: limpiarConfig(normalizarMonturaConfig(producto.montura_config, legacyBase))
            };
        case 'Lentes de contacto':
            return {
                lenteContactoConfig: limpiarConfig(normalizarLenteContactoConfig(producto.lente_contacto_config, legacyBase))
            };
        case 'Líquidos':
            return {
                liquidoConfig: limpiarConfig(normalizarLiquidoConfig(producto.liquido_config, legacyBase))
            };
        case 'Estuches':
            return {
                estucheConfig: limpiarConfig(normalizarEstucheConfig(producto.estuche_config, legacyBase))
            };
        case 'Accesorios':
            return {
                accesorioConfig: limpiarConfig(normalizarAccesorioConfig(producto.accesorio_config, legacyBase))
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
        const cristalConfig = bloquesConfig.cristalConfig || {};
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
            const monturaConfig = bloquesConfig.monturaConfig || {};
            return {
                ...baseOutput,
                monturaConfig: {
                    categoria: 'Monturas',
                    marca: normalizarTextoNullable(monturaConfig.marca),
                    modelo: normalizarTextoNullable(monturaConfig.modelo),
                    color: normalizarTextoNullable(monturaConfig.color),
                    material: normalizarTextoNullable(monturaConfig.material),
                    proveedor: normalizarTextoNullable(monturaConfig.proveedor),
                    descripcion: normalizarTextoNullable(monturaConfig.descripcion)
                }
            };
        }
        case 'Lentes de contacto': {
            const lenteContactoConfig = bloquesConfig.lenteContactoConfig || {};
            return {
                ...baseOutput,
                lenteContactoConfig: {
                    categoria: 'Lentes de contacto',
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
            const liquidoConfig = bloquesConfig.liquidoConfig || {};
            return {
                ...baseOutput,
                liquidoConfig: {
                    categoria: 'Líquidos',
                    marca: normalizarTextoNullable(liquidoConfig.marca),
                    modelo: normalizarTextoNullable(liquidoConfig.modelo),
                    proveedor: normalizarTextoNullable(liquidoConfig.proveedor),
                    descripcion: normalizarTextoNullable(liquidoConfig.descripcion)
                }
            };
        }
        case 'Estuches': {
            const estucheConfig = bloquesConfig.estucheConfig || {};
            return {
                ...baseOutput,
                estucheConfig: {
                    categoria: 'Estuches',
                    marca: normalizarTextoNullable(estucheConfig.marca),
                    modelo: normalizarTextoNullable(estucheConfig.modelo),
                    material: normalizarTextoNullable(estucheConfig.material),
                    proveedor: normalizarTextoNullable(estucheConfig.proveedor),
                    descripcion: normalizarTextoNullable(estucheConfig.descripcion)
                }
            };
        }
        case 'Accesorios': {
            const accesorioConfig = bloquesConfig.accesorioConfig || {};
            return {
                ...baseOutput,
                accesorioConfig: {
                    categoria: 'Accesorios',
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

            const cristalConfigBody = parseJsonObjectFlexible(req.body.cristalConfig);
            const {
                nombre,
                categoria,
                stock,
                precio,
                requiere_formula: requiereFormulaPar,
                requiere_item_padre: requiereItemPadrePar,
                activo: activo_string,
                descripcion,
                aplicaIva: aplicaIva_string
            } = req.body;

            const activo = normalizarBooleanFlexible(activo_string);
            const aplicaIva = normalizarBooleanFlexible(aplicaIva_string);
            const requiereFormula = normalizarBooleanFlexible(requiereFormulaPar);
            const requiereItemPadre = normalizarBooleanFlexible(requiereItemPadrePar);
            const categoriaNormalizada = resolverCategoriaDesdeBody(req.body);
            const datosCategoria = resolverPersistenciaPorCategoria(categoriaNormalizada, req.body);
            const nombreProducto = normalizarTexto(nombre) || datosCategoria.nombre;

            if (!VerificationUtils.verify_nombre(nombreProducto)) {
                return res.status(400).json({ message: "El nombre no puede quedar vacio." });
            }
            if (!VerificationUtils.verify_nombre(categoriaNormalizada)) {
                return res.status(400).json({ message: "La categoria no puede quedar vacio." });
            }
            if (!VerificationUtils.verify_numero(stock)) {
                return res.status(400).json({ message: "El stock debe ser numerico" });
            }
            if (!VerificationUtils.verify_numero(precio)) {
                return res.status(400).json({ message: "El precio debe ser numerico" });
            }
            if (!VerificationUtils.verify_boolean(activo)) {
                return res.status(400).json({ message: "El parametro 'activo' debe ser booleano." });
            }
            if (!VerificationUtils.verify_boolean(aplicaIva)) {
                return res.status(400).json({ message: "El parametro 'aplicaIva' debe ser booleano." });
            }
            if (!VerificationUtils.verify_boolean(requiereFormula)) {
                return res.status(400).json({ message: "El parametro 'requiere_formula' debe ser booleano." });
            }
            if (!VerificationUtils.verify_boolean(requiereItemPadre)) {
                return res.status(400).json({ message: "El parametro 'requiere_item_padre' debe ser booleano." });
            }
            if (!CATEGORIAS_COMERCIALES.includes(categoriaNormalizada)) {
                return res.status(400).json({ message: "La categoria enviada no forma parte del contrato comercial actual." });
            }

            const moneda_base = await ConfiguracionService.get_moneda_base(req.sede.id);
            const moneda = moneda_base.valor;
            
            const objTasa = await Tasa.findOne({ where: { id: moneda } });
            if (!objTasa) {
                return res.status(400).json({ message: "La moneda enviada no existe: " + moneda + "." });
            }

            const count = await Producto.count({
                where: {
                    sede_id: req.sede.id,
                    nombre: nombreProducto,
                    marca: datosCategoria.marca,
                    color: datosCategoria.color,
                    categoria: categoriaNormalizada
                }
            });
            if (count > 0) {
                return res.status(400).json({ message: "Ya existe un producto con el mismo nombre, marca, color y categoria en la sede actual." });
            }

            let precio_number = Number(precio);
            let precio_sin_iva = Number(precio_number);
            if(aplicaIva) {
                precio_sin_iva = Number(precio_number * ( 100 / 116 ));
            }

            const objProducto = await Producto.create({
                sede_id: req.sede.id,
                nombre: nombreProducto,
                marca: datosCategoria.marca,
                color: datosCategoria.color,
                codigo: null,
                material: datosCategoria.material,
                proveedor: datosCategoria.proveedor,
                categoria: categoriaNormalizada,
                modelo: datosCategoria.modelo,
                stock: stock,
                precio: Number(precio_sin_iva.toFixed(2)),
                aplica_iva: aplicaIva,
                precio_con_iva: Number(precio_number.toFixed(2)),
                moneda: objTasa.id,
                activo: activo,
                    descripcion: datosCategoria.descripcion,
                cristal_config: datosCategoria.cristal_config,
                montura_config: datosCategoria.montura_config,
                lente_contacto_config: datosCategoria.lente_contacto_config,
                liquido_config: datosCategoria.liquido_config,
                estuche_config: datosCategoria.estuche_config,
                accesorio_config: datosCategoria.accesorio_config,
                requiere_formula: requiereFormula,
                requiere_item_padre: requiereItemPadre,
                imagen_url: "/public/images/product-generic-image.jpg?t=" + Date.now()
            });

            objProducto.codigo = `PR-${objProducto.id.toString().padStart(6, '0')}`;
            await objProducto.save();

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
            const cristalConfigBody = parseJsonObjectFlexible(req.body.cristalConfig);
            const {
                nombre,
                categoria,
                stock,
                precio,
                requiere_formula: requiereFormulaPar,
                requiere_item_padre: requiereItemPadrePar,
                activo: activo_string,
                descripcion,
                aplicaIva: aplicaIva_string
            } = req.body;

            const activo = normalizarBooleanFlexible(activo_string);
            const aplicaIva = normalizarBooleanFlexible(aplicaIva_string);
            const requiereFormula = normalizarBooleanFlexible(requiereFormulaPar);
            const requiereItemPadre = normalizarBooleanFlexible(requiereItemPadrePar);
            const categoriaNormalizada = resolverCategoriaDesdeBody(req.body);
            const datosCategoria = resolverPersistenciaPorCategoria(categoriaNormalizada, req.body);
            const nombreProducto = normalizarTexto(nombre) || datosCategoria.nombre;

            if (!VerificationUtils.verify_nombre(nombreProducto)) {
                return res.status(400).json({ message: "El nombre no puede quedar vacio." });
            }
            if (!VerificationUtils.verify_nombre(categoriaNormalizada)) {
                return res.status(400).json({ message: "La categoria no puede quedar vacio." });
            }
            if (!VerificationUtils.verify_numero(stock)) {
                return res.status(400).json({ message: "El stock debe ser numerico" });
            }
            if (!VerificationUtils.verify_numero(precio)) {
                return res.status(400).json({ message: "El precio debe ser numerico" });
            }
            if (!VerificationUtils.verify_boolean(activo)) {
                return res.status(400).json({ message: "El parametro 'activo' debe ser booleano." });
            }
            if (!VerificationUtils.verify_boolean(aplicaIva)) {
                return res.status(400).json({ message: "El parametro 'aplicaIva' debe ser booleano." });
            }
            if (!VerificationUtils.verify_boolean(requiereFormula)) {
                return res.status(400).json({ message: "El parametro 'requiere_formula' debe ser booleano." });
            }
            if (!VerificationUtils.verify_boolean(requiereItemPadre)) {
                return res.status(400).json({ message: "El parametro 'requiere_item_padre' debe ser booleano." });
            }
            if (!CATEGORIAS_COMERCIALES.includes(categoriaNormalizada)) {
                return res.status(400).json({ message: "La categoria enviada no forma parte del contrato comercial actual." });
            }

            const count = await Producto.count({
                where: {
                    id: { [Op.ne]: objProducto.id },
                    sede_id: req.sede.id,
                    nombre: nombreProducto,
                    marca: datosCategoria.marca,
                    color: datosCategoria.color,
                    categoria: categoriaNormalizada
                }
            });
            if (count > 0) {
                return res.status(400).json({ message: "Ya existe un producto con el mismo nombre, marca, color y categoria en la sede actual." });
            }

            let precio_number = Number(precio);
            let precio_sin_iva = Number(precio_number);
            if(aplicaIva) {
                precio_sin_iva = Number(precio_number * ( 100 / 116 ));
            }

            objProducto.nombre = nombreProducto;
            objProducto.marca = datosCategoria.marca;
            objProducto.color = datosCategoria.color;
            objProducto.material = datosCategoria.material;
            objProducto.proveedor = datosCategoria.proveedor;
            objProducto.categoria = categoriaNormalizada;
            objProducto.modelo = datosCategoria.modelo;
            objProducto.stock = stock;
            objProducto.precio = Number(precio_sin_iva.toFixed(2));
            objProducto.aplica_iva = aplicaIva;
            objProducto.precio_con_iva = Number(precio_number.toFixed(2));
            objProducto.activo = activo;
            objProducto.descripcion = datosCategoria.descripcion;
            objProducto.cristal_config = datosCategoria.cristal_config;
            objProducto.montura_config = datosCategoria.montura_config;
            objProducto.lente_contacto_config = datosCategoria.lente_contacto_config;
            objProducto.liquido_config = datosCategoria.liquido_config;
            objProducto.estuche_config = datosCategoria.estuche_config;
            objProducto.accesorio_config = datosCategoria.accesorio_config;
            objProducto.requiere_formula = requiereFormula;
            objProducto.requiere_item_padre = requiereItemPadre;

            await objProducto.save();

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
            const existe_imagen = (producto.imagen_url !== null && limpiarYValidarRuta(producto.imagen_url));
            const ruta_imagen = (existe_imagen) ? (producto.imagen_url) : ("/public/images/product-generic-image.jpg?t=" + Date.now());

            productos_output.push(construirProductoOutput(producto, ruta_imagen));
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