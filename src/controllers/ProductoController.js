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

    if (['filtro', 'filtros', 'aditivo', 'aditivos', 'filtro/aditivos', 'filtros/aditivos'].includes(categoriaNormalizada)) {
        return 'Filtro/Aditivos';
    }

    return categoriaLimpia;
}

function construirProductoOutput(producto, imagenUrl) {
    return {
        id: producto.id,
        sede_id: producto.sede_id,
        nombre: producto.nombre,
        marca: producto.marca,
        color: producto.color,
        codigo: producto.codigo,
        material: producto.material,
        proveedor: producto.proveedor,
        categoria: normalizarCategoriaProducto(producto.categoria),
        modelo: producto.modelo,
        stock: producto.stock,
        precio: producto.precio,
        aplicaIva: producto.aplica_iva,
        precioConIva: producto.precio_con_iva,
        moneda: producto.moneda,
        activo: producto.activo,
        descripcion: producto.descripcion,
        imagen_url: imagenUrl ?? producto.imagen_url,
        created_at: producto.created_at,
        updated_at: producto.updated_at,
        requiere_formula: producto.requiere_formula,
        requiere_item_padre: producto.requiere_item_padre,
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
                marca: marcaPar,
                color: colorPar,
                material: materialPar,
                proveedor: proveedorPar,
                categoria,
                modelo: modeloPar,
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
            const color = normalizarTextoNullable(colorPar);
            const proveedor = normalizarTextoNullable(proveedorPar);
            const modelo = normalizarTextoNullable(modeloPar);
            const marca = normalizarTexto(marcaPar);
            const materialNormalizado = normalizarTexto(materialPar);
            const categoriaNormalizada = normalizarCategoriaProducto(categoria);
            const descripcionNormalizada = normalizarTextoNullable(descripcion);

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
                    marca: marca,
                    color: color,
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
                marca: marca,
                color: color,
                codigo: null,
                material: materialNormalizado,
                proveedor: proveedor,
                categoria: categoriaNormalizada,
                modelo: modelo,
                stock: stock,
                precio: Number(precio_sin_iva.toFixed(2)),
                aplica_iva: aplicaIva,
                precio_con_iva: Number(precio_number.toFixed(2)),
                moneda: objTasa.id,
                activo: activo,
                descripcion: descripcionNormalizada,
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
                marca: marcaPar,
                color: colorPar,
                material: materialPar,
                proveedor: proveedorPar,
                categoria,
                modelo: modeloPar,
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
            const color = normalizarTextoNullable(colorPar);
            const proveedor = normalizarTextoNullable(proveedorPar);
            const modelo = normalizarTextoNullable(modeloPar);
            const marca = normalizarTexto(marcaPar);
            const materialNormalizado = normalizarTexto(materialPar);
            const categoriaNormalizada = normalizarCategoriaProducto(categoria);
            const descripcionNormalizada = normalizarTextoNullable(descripcion);

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

            const count = await Producto.count({
                where: {
                    id: { [Op.ne]: objProducto.id },
                    sede_id: req.sede.id,
                    nombre: nombre,
                    marca: marca,
                    color: color,
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
            objProducto.marca = marca;
            objProducto.color = color;
            objProducto.material = materialNormalizado;
            objProducto.proveedor = proveedor;
            objProducto.categoria = categoriaNormalizada;
            objProducto.modelo = modelo;
            objProducto.stock = stock;
            objProducto.precio = Number(precio_sin_iva.toFixed(2));
            objProducto.aplica_iva = aplicaIva;
            objProducto.precio_con_iva = Number(precio_number.toFixed(2));
            objProducto.activo = activo;
            objProducto.descripcion = descripcionNormalizada;
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
                where: { pkey: producto_id }
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
        const categorias_output = [];
        const categoriasVistas = new Set();

        categorias_db.forEach(categoria => {
            const nombreNormalizado = normalizarCategoriaProducto(categoria.nombre);
            if (categoriasVistas.has(nombreNormalizado)) {
                return;
            }

            categoriasVistas.add(nombreNormalizado);
            categorias_output.push({
                id: categoria.id,
                nombre: nombreNormalizado
            });
        });

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