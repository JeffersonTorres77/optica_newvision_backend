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
    const tipoCristal = normalizarTexto(config?.tipoCristal ?? legacy.modelo);
    const presentacion = normalizarTexto(config?.presentacion ?? legacy.marca);
    const materialOtro = normalizarTexto(config?.materialOtro ?? legacy.materialOtro);
    const material = normalizarTexto(config?.material ?? legacy.material) || (materialOtro ? 'Otro' : '');
    const proveedor = normalizarTexto(config?.proveedor ?? legacy.proveedor);

    return {
        tipoCristal,
        presentacion,
        material,
        proveedor,
        tratamientos: normalizarArrayTextos(config?.tratamientos ?? legacy.tratamientos),
        rangoFormula: normalizarTexto(config?.rangoFormula ?? legacy.rangoFormula),
        costoLaboratorio: normalizarNumeroNullable(config?.costoLaboratorio ?? legacy.costoLaboratorio),
        materialOtro
    };
}

function normalizarMonturaConfig(config, legacy = {}) {
    return {
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        color: normalizarTexto(config?.color ?? legacy.color),
        material: normalizarTexto(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor)
    };
}

function normalizarLenteContactoConfig(config, legacy = {}) {
    return {
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        tipoLenteContacto: normalizarTexto(config?.tipoLenteContacto ?? legacy.modelo),
        color: normalizarTexto(config?.color ?? legacy.color),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor)
    };
}

function normalizarLiquidoConfig(config, legacy = {}) {
    return {
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor)
    };
}

function normalizarEstucheConfig(config, legacy = {}) {
    return {
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        material: normalizarTexto(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor)
    };
}

function normalizarAccesorioConfig(config, legacy = {}) {
    return {
        marca: normalizarTexto(config?.marca ?? legacy.marca),
        modelo: normalizarTexto(config?.modelo ?? legacy.modelo),
        color: normalizarTexto(config?.color ?? legacy.color),
        material: normalizarTexto(config?.material ?? legacy.material),
        proveedor: normalizarTexto(config?.proveedor ?? legacy.proveedor)
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
        color: body.color,
        material: body.material,
        proveedor: body.proveedor,
        modelo: body.modelo
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

            return {
                ...basePersistencia,
                marca: normalizarTexto(cristalConfig?.presentacion),
                color: null,
                material: normalizarTexto(cristalConfig?.material),
                proveedor: normalizarTextoNullable(cristalConfig?.proveedor),
                modelo: normalizarTextoNullable(cristalConfig?.tipoCristal),
                cristal_config: cristalConfig
            };
        }
        case 'Monturas': {
            const monturaConfig = limpiarConfig(normalizarMonturaConfig(monturaConfigBody, legacyBase));
            return {
                ...basePersistencia,
                marca: normalizarTexto(monturaConfig?.marca),
                color: normalizarTextoNullable(monturaConfig?.color),
                material: normalizarTexto(monturaConfig?.material),
                proveedor: normalizarTextoNullable(monturaConfig?.proveedor),
                modelo: normalizarTextoNullable(monturaConfig?.modelo),
                montura_config: monturaConfig
            };
        }
        case 'Lentes de contacto': {
            const lenteContactoConfig = limpiarConfig(normalizarLenteContactoConfig(lenteContactoConfigBody, legacyBase));
            return {
                ...basePersistencia,
                marca: normalizarTexto(lenteContactoConfig?.marca),
                color: normalizarTextoNullable(lenteContactoConfig?.color),
                material: '',
                proveedor: normalizarTextoNullable(lenteContactoConfig?.proveedor),
                modelo: normalizarTextoNullable(lenteContactoConfig?.tipoLenteContacto),
                lente_contacto_config: lenteContactoConfig
            };
        }
        case 'Líquidos': {
            const liquidoConfig = limpiarConfig(normalizarLiquidoConfig(liquidoConfigBody, legacyBase));
            return {
                ...basePersistencia,
                marca: normalizarTexto(liquidoConfig?.marca),
                color: null,
                material: '',
                proveedor: normalizarTextoNullable(liquidoConfig?.proveedor),
                modelo: normalizarTextoNullable(liquidoConfig?.modelo),
                liquido_config: liquidoConfig
            };
        }
        case 'Estuches': {
            const estucheConfig = limpiarConfig(normalizarEstucheConfig(estucheConfigBody, legacyBase));
            return {
                ...basePersistencia,
                marca: normalizarTexto(estucheConfig?.marca),
                color: null,
                material: normalizarTexto(estucheConfig?.material),
                proveedor: normalizarTextoNullable(estucheConfig?.proveedor),
                modelo: normalizarTextoNullable(estucheConfig?.modelo),
                estuche_config: estucheConfig
            };
        }
        case 'Accesorios': {
            const accesorioConfig = limpiarConfig(normalizarAccesorioConfig(accesorioConfigBody, legacyBase));
            return {
                ...basePersistencia,
                marca: normalizarTexto(accesorioConfig?.marca),
                color: normalizarTextoNullable(accesorioConfig?.color),
                material: normalizarTexto(accesorioConfig?.material),
                proveedor: normalizarTextoNullable(accesorioConfig?.proveedor),
                modelo: normalizarTextoNullable(accesorioConfig?.modelo),
                accesorio_config: accesorioConfig
            };
        }
        default:
            return basePersistencia;
    }
}

function construirBloquesConfigProducto(producto) {
    const descripcionLegacy = parseDescripcionCristalLegacy(producto.descripcion);
    const legacyBase = {
        marca: producto.marca,
        color: producto.color,
        material: producto.material,
        proveedor: producto.proveedor,
        modelo: producto.modelo
    };

    switch (normalizarCategoriaProducto(producto.categoria)) {
        case 'Cristales':
            return {
                cristalConfig: limpiarConfig(normalizarCristalConfig(
                    producto.cristal_config ?? descripcionLegacy.crystalConfig,
                    {
                        ...legacyBase,
                        ...descripcionLegacy.crystalConfig
                    }
                ))
            };
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

    return {
        id: producto.id,
        sede_id: producto.sede_id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        categoria: normalizarCategoriaProducto(producto.categoria),
        stock: producto.stock,
        precio: producto.precio,
        aplicaIva: producto.aplica_iva,
        precioConIva: producto.precio_con_iva,
        moneda: producto.moneda,
        activo: producto.activo,
        descripcion: normalizarTextoNullable(descripcionLegacy.descripcionUsuario),
        imagen_url: imagenUrl ?? producto.imagen_url,
        created_at: producto.created_at,
        updated_at: producto.updated_at,
        requiere_formula: producto.requiere_formula,
        ...construirBloquesConfigProducto(producto)
    };
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
            const categoriaNormalizada = normalizarCategoriaProducto(categoria);
            const datosCategoria = resolverPersistenciaPorCategoria(categoriaNormalizada, req.body);

            if (!VerificationUtils.verify_nombre(nombre)) {
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
                    nombre: nombre,
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
                nombre: nombre,
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
            const categoriaNormalizada = normalizarCategoriaProducto(categoria);
            const datosCategoria = resolverPersistenciaPorCategoria(categoriaNormalizada, req.body);

            if (!VerificationUtils.verify_nombre(nombre)) {
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
                    nombre: nombre,
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

            objProducto.nombre = nombre;
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