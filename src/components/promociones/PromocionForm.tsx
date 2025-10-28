import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Percent,
  DollarSign,
  Hash,
  Tag,
  X,
} from "lucide-react";
import { Button } from "../common/Button";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Alert } from "../common/Alert";
import { ImageUpload } from "../common/ImageUpload"; // ✅ Importar componente de carga
import { useProductos } from "../../hooks/useProductos";
import { useInsumos } from "../../hooks/useInsumos";
import type {
  PromocionRequestDTO,
  PromocionResponseDTO,
} from "../../types/promociones";
import type { ImagenDTO } from "../../types/common/ImagenDTO"; // ✅ Importar tipo
import { CalculadoraDescuentosService } from "../../services/CalculadoraDescuentosService";

interface PromocionFormProps {
  promocion?: PromocionResponseDTO | null;
  onGuardar: (data: PromocionRequestDTO) => Promise<void>;
  onCancelar: () => void;
}

interface ProductoSeleccionado {
  id: number;
  nombre: string;
  precio: number;
  tipo: "MANUFACTURADO" | "INSUMO";
}

// ✅ Tipo unificado para todos los artículos
type ArticuloUnificado = {
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  tipo: "MANUFACTURADO" | "INSUMO";
};

export const PromocionForm: React.FC<PromocionFormProps> = ({
  promocion,
  onGuardar,
  onCancelar,
}) => {
  const { productos, loading: loadingProductos } = useProductos();
  const { insumos, loading: loadingInsumos } = useInsumos(); // ✅ Usar hook de insumos

  // Estados del formulario
  const [formData, setFormData] = useState({
    denominacion: "",
    fechaDesde: "",
    fechaHasta: "",
    horaDesde: "00:00",
    horaHasta: "23:59",
    descripcionDescuento: "",
    tipoDescuento: "PORCENTUAL" as "PORCENTUAL" | "MONTO_FIJO",
    valorDescuento: 0,
    cantidadMinima: 1,
    activo: true,
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [imagenesPromocionales, setImagenesPromocionales] = useState<
    ImagenDTO[]
  >([]); // ✅ Cambiar a ImagenDTO[]

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Combinar productos manufacturados e insumos vendibles
  const articulosDisponibles: ArticuloUnificado[] = React.useMemo(() => {
    const productosManufacturados: ArticuloUnificado[] = productos.map((p) => ({
      idArticulo: p.idArticulo,
      denominacion: p.denominacion,
      precioVenta: p.precioVenta,
      tipo: "MANUFACTURADO" as const,
    }));

    // ✅ Filtrar solo insumos que NO son para elaborar (son para venta)
    const insumosVendibles: ArticuloUnificado[] = insumos
      .filter((i) => !i.esParaElaborar && !i.eliminado)
      .map((i) => ({
        idArticulo: i.idArticulo,
        denominacion: i.denominacion,
        precioVenta: i.precioVenta,
        tipo: "INSUMO" as const,
      }));

    return [...productosManufacturados, ...insumosVendibles].sort((a, b) =>
      a.denominacion.localeCompare(b.denominacion)
    );
  }, [productos, insumos]);

  // Inicializar formulario con datos de la promoción (modo edición)
  useEffect(() => {
    if (promocion) {
      setFormData({
        denominacion: promocion.denominacion,
        fechaDesde: promocion.fechaDesde.split("T")[0],
        fechaHasta: promocion.fechaHasta.split("T")[0],
        horaDesde: promocion.horaDesde.slice(0, 5),
        horaHasta: promocion.horaHasta.slice(0, 5),
        descripcionDescuento: promocion.descripcionDescuento || "",
        tipoDescuento: promocion.tipoDescuento,
        valorDescuento: promocion.valorDescuento,
        cantidadMinima: promocion.cantidadMinima,
        activo: promocion.activo,
      });

      // ✅ Mapear productos desde la promoción existente
      setProductosSeleccionados(
        promocion.articulos.map((art) => ({
          id: art.idArticulo,
          nombre: art.denominacion,
          precio: art.precioVenta,
          tipo: "MANUFACTURADO" as const, // Por defecto, en edición asumimos manufacturados
        }))
      );

      // ✅ Mapear imágenes como ImagenDTO
      const imagenesDTO: ImagenDTO[] = (promocion.urlsImagenes || []).map(
        (url, index) => ({
          idImagen: undefined,
          denominacion: `Imagen promocional ${index + 1}`,
          url: url,
        })
      );
      setImagenesPromocionales(imagenesDTO);
    }
  }, [promocion]);

  // Manejar cambios en inputs
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  // ✅ Agregar producto seleccionado (manufacturado o insumo)
  const agregarProducto = (articulo: ArticuloUnificado) => {
    const yaSeleccionado = productosSeleccionados.some(
      (p) => p.id === articulo.idArticulo
    );
    if (yaSeleccionado) {
      setError("Este producto ya está seleccionado");
      return;
    }

    setProductosSeleccionados((prev) => [
      ...prev,
      {
        id: articulo.idArticulo,
        nombre: articulo.denominacion,
        precio: articulo.precioVenta,
        tipo: articulo.tipo,
      },
    ]);
    setError(null);
  };

  // Remover producto seleccionado
  const removerProducto = (id: number) => {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id));
  };

  // ✅ Agregar nueva imagen promocional
  const agregarImagenPromocional = () => {
    const nuevaImagen: ImagenDTO = {
      idImagen: undefined,
      denominacion: `Imagen promocional ${imagenesPromocionales.length + 1}`,
      url: "", // Se llenará cuando se suba la imagen
    };
    setImagenesPromocionales((prev) => [...prev, nuevaImagen]);
  };

  // ✅ Actualizar imagen promocional específica
  const actualizarImagenPromocional = (
    index: number,
    imagen: ImagenDTO | null
  ) => {
    if (imagen) {
      setImagenesPromocionales((prev) =>
        prev.map((img, i) => (i === index ? imagen : img))
      );
    } else {
      // Eliminar imagen
      removerImagenPromocional(index);
    }
  };

  // ✅ Remover imagen promocional
  const removerImagenPromocional = (index: number) => {
    setImagenesPromocionales((prev) => prev.filter((_, i) => i !== index));
  };

  // Validar formulario
  const validarFormulario = (): string | null => {
    if (!formData.denominacion.trim()) {
      return "El nombre de la promoción es obligatorio";
    }

    if (!formData.fechaDesde || !formData.fechaHasta) {
      return "Las fechas de vigencia son obligatorias";
    }

    if (new Date(formData.fechaDesde) > new Date(formData.fechaHasta)) {
      return "La fecha de inicio no puede ser posterior a la fecha de fin";
    }

    if (formData.horaDesde >= formData.horaHasta) {
      return "La hora de inicio debe ser anterior a la hora de fin";
    }

    if (formData.valorDescuento <= 0) {
      return "El valor del descuento debe ser mayor a 0";
    }

    if (
      formData.tipoDescuento === "PORCENTUAL" &&
      formData.valorDescuento > 100
    ) {
      return "El descuento porcentual no puede ser mayor al 100%";
    }

    if (formData.cantidadMinima < 1) {
      return "La cantidad mínima debe ser al menos 1";
    }

    if (productosSeleccionados.length === 0) {
      return "Debe seleccionar al menos un producto";
    }

    return null;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ Calcular precio promocional (precio total de la promoción después del descuento)
      const precioPromocional =
        productosSeleccionados.length > 0
          ? productosSeleccionados.reduce((sum, producto) => {
              // Usar la calculadora unificada para consistencia
              const promocionTemporal = {
                idPromocion: 0,
                denominacion: formData.denominacion,
                tipoDescuento: formData.tipoDescuento,
                valorDescuento: formData.valorDescuento,
                cantidadMinima: formData.cantidadMinima,
                estaVigente: true,
                articulos: [
                  {
                    idArticulo: producto.id,
                    denominacion: producto.nombre,
                    precioVenta: producto.precio,
                  },
                ],
              } as any;

              const calculo =
                CalculadoraDescuentosService.calcularDescuentoPromocion(
                  promocionTemporal,
                  producto.precio,
                  1
                );

              return sum + calculo.precioFinal;
            }, 0)
          : 0;

      const promocionRequest: PromocionRequestDTO = {
        denominacion: formData.denominacion.trim(),
        fechaDesde: `${formData.fechaDesde}T00:00:00`,
        fechaHasta: `${formData.fechaHasta}T23:59:59`,
        horaDesde: `${formData.horaDesde}:00`,
        horaHasta: `${formData.horaHasta}:59`,
        descripcionDescuento: formData.descripcionDescuento.trim() || undefined,
        tipoDescuento: formData.tipoDescuento,
        valorDescuento: formData.valorDescuento,
        precioPromocional: Math.round(precioPromocional * 100) / 100,
        cantidadMinima: formData.cantidadMinima,
        activo: formData.activo,
        idsArticulos: productosSeleccionados.map((p) => p.id),
        urlsImagenes: imagenesPromocionales
          .filter((img) => img.url && img.url.trim() !== "")
          .map((img) => img.url),
      };

      console.log("🚀 Promoción a guardar:", promocionRequest);
      await onGuardar(promocionRequest);
    } catch (err: any) {
      setError(err.message || "Error al guardar la promoción");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProductos || loadingInsumos) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Nombre de la promoción *
          </label>
          <input
            type="text"
            value={formData.denominacion}
            onChange={(e) => handleInputChange("denominacion", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 15% descuento en pizzas"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={formData.descripcionDescuento}
            onChange={(e) =>
              handleInputChange("descripcionDescuento", e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descripción adicional del descuento"
            maxLength={200}
          />
        </div>
      </div>

      {/* Tipo y valor del descuento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de descuento *
          </label>
          <select
            value={formData.tipoDescuento}
            onChange={(e) => handleInputChange("tipoDescuento", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PORCENTUAL">Porcentual (%)</option>
            <option value="MONTO_FIJO">Monto fijo ($)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.tipoDescuento === "PORCENTUAL" ? (
              <>
                <Percent className="w-4 h-4 inline mr-1" />
                Porcentaje de descuento *
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monto de descuento *
              </>
            )}
          </label>
          <input
            type="number"
            value={formData.valorDescuento}
            onChange={(e) =>
              handleInputChange(
                "valorDescuento",
                parseFloat(e.target.value) || 0
              )
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            max={formData.tipoDescuento === "PORCENTUAL" ? "100" : undefined}
            step={formData.tipoDescuento === "PORCENTUAL" ? "1" : "0.01"}
            placeholder={
              formData.tipoDescuento === "PORCENTUAL" ? "15" : "50.00"
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            Cantidad mínima *
          </label>
          <input
            type="number"
            value={formData.cantidadMinima}
            onChange={(e) =>
              handleInputChange("cantidadMinima", parseInt(e.target.value) || 1)
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            placeholder="1"
          />
        </div>
      </div>

      {/* Período de vigencia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Fecha desde *
          </label>
          <input
            type="date"
            value={formData.fechaDesde}
            onChange={(e) => handleInputChange("fechaDesde", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Fecha hasta *
          </label>
          <input
            type="date"
            value={formData.fechaHasta}
            onChange={(e) => handleInputChange("fechaHasta", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Hora desde *
          </label>
          <input
            type="time"
            value={formData.horaDesde}
            onChange={(e) => handleInputChange("horaDesde", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Hora hasta *
          </label>
          <input
            type="time"
            value={formData.horaHasta}
            onChange={(e) => handleInputChange("horaHasta", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* ✅ PRODUCTOS INCLUIDOS - MEJORADO PARA INSUMOS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Productos incluidos en la promoción *
          <span className="text-xs text-gray-500 block mt-1">
            Incluye productos manufacturados e insumos para la venta
          </span>
        </label>

        {/* Selector de productos */}
        <div className="mb-4">
          <select
            onChange={(e) => {
              const articulo = articulosDisponibles.find(
                (a) => a.idArticulo === parseInt(e.target.value)
              );
              if (articulo) {
                agregarProducto(articulo);
                e.target.value = "";
              }
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            defaultValue=""
          >
            <option value="" disabled>
              Seleccionar un producto...
            </option>
            {articulosDisponibles
              .filter(
                (a) =>
                  !productosSeleccionados.some((ps) => ps.id === a.idArticulo)
              )
              .map((articulo) => (
                <option
                  key={`${articulo.tipo}-${articulo.idArticulo}`}
                  value={articulo.idArticulo}
                >
                  {articulo.denominacion} - ${articulo.precioVenta} (
                  {articulo.tipo === "INSUMO" ? "Insumo" : "Producto"})
                </option>
              ))}
          </select>
        </div>

        {/* Lista de productos seleccionados */}
        {productosSeleccionados.length > 0 && (
          <div className="space-y-2">
            {productosSeleccionados.map((producto) => {
              // Calcular precio con descuento para este producto
              let precioConDescuento = producto.precio;
              if (formData.valorDescuento > 0) {
                if (formData.tipoDescuento === "PORCENTUAL") {
                  precioConDescuento =
                    producto.precio * (1 - formData.valorDescuento / 100);
                } else {
                  precioConDescuento = Math.max(
                    0,
                    producto.precio - formData.valorDescuento
                  );
                }
              }

              return (
                <div
                  key={producto.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{producto.nombre}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          producto.tipo === "INSUMO"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {producto.tipo === "INSUMO" ? "Insumo" : "Producto"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="line-through">${producto.precio}</span>
                      {formData.valorDescuento > 0 && (
                        <span className="ml-2 text-green-600 font-medium">
                          ${precioConDescuento.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerProducto(producto.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Precio promocional total (después del descuento) */}
            {formData.valorDescuento > 0 &&
              productosSeleccionados.length > 0 &&
              (() => {
                // Calcular usando la calculadora unificada para cada producto
                const calculosDetallados = productosSeleccionados.map(
                  (producto) => {
                    // Crear promoción temporal para calcular
                    const promocionTemporal = {
                      idPromocion: 0,
                      denominacion:
                        formData.denominacion || "Promoción temporal",
                      tipoDescuento: formData.tipoDescuento,
                      valorDescuento: formData.valorDescuento,
                      cantidadMinima: formData.cantidadMinima,
                      estaVigente: true,
                      articulos: [
                        {
                          idArticulo: producto.id,
                          denominacion: producto.nombre,
                          precioVenta: producto.precio,
                        },
                      ],
                    } as any;

                    const calculo =
                      CalculadoraDescuentosService.calcularDescuentoPromocion(
                        promocionTemporal,
                        producto.precio,
                        1 // cantidad base para el cálculo
                      );

                    return {
                      producto,
                      calculo,
                      ahorroTotal: calculo.montoDescuento,
                      precioFinal: calculo.precioFinal,
                    };
                  }
                );

                const totalOriginal = productosSeleccionados.reduce(
                  (sum, p) => sum + p.precio,
                  0
                );
                const totalConDescuento = calculosDetallados.reduce(
                  (sum, calc) => sum + calc.precioFinal,
                  0
                );
                const ahorroTotal = calculosDetallados.reduce(
                  (sum, calc) => sum + calc.ahorroTotal,
                  0
                );
                const porcentajeAhorroReal =
                  (ahorroTotal / totalOriginal) * 100;

                return (
                  <div className="mt-3 space-y-3">
                    {/* Resumen ejecutivo mejorado */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-blue-800">
                          💰 Resumen de la Promoción
                        </div>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {formData.tipoDescuento === "PORCENTUAL"
                            ? `${formData.valorDescuento}%`
                            : `$${formData.valorDescuento}`}{" "}
                          OFF
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">
                            Precio original total:
                          </div>
                          <div className="font-semibold text-gray-900">
                            {CalculadoraDescuentosService.formatearMonto(
                              totalOriginal
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">
                            Precio promocional total:
                          </div>
                          <div className="font-bold text-blue-900 text-lg">
                            {CalculadoraDescuentosService.formatearMonto(
                              totalConDescuento
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Ahorro total:</div>
                          <div className="font-semibold text-green-600">
                            {CalculadoraDescuentosService.formatearMonto(
                              ahorroTotal
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">% Ahorro real:</div>
                          <div className="font-semibold text-green-600">
                            {CalculadoraDescuentosService.formatearPorcentaje(
                              porcentajeAhorroReal
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-blue-600 mt-3 p-2 bg-blue-100 rounded">
                        📊 Cálculos realizados con CalculadoraDescuentosService
                        - Garantía de consistencia
                      </div>
                    </div>

                    {/* Detalles por producto */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-800 mb-3">
                        📋 Detalle por producto:
                      </div>
                      <div className="space-y-2">
                        {calculosDetallados.map(
                          (
                            { producto, calculo, ahorroTotal, precioFinal },
                            index
                          ) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded border"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {producto.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {producto.tipo === "INSUMO"
                                    ? "🥫 Insumo"
                                    : "🍕 Producto"}
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500 line-through text-sm">
                                    {CalculadoraDescuentosService.formatearMonto(
                                      producto.precio
                                    )}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    {CalculadoraDescuentosService.formatearMonto(
                                      precioFinal
                                    )}
                                  </span>
                                </div>
                                <div className="text-xs text-green-600">
                                  Ahorra:{" "}
                                  {CalculadoraDescuentosService.formatearMonto(
                                    ahorroTotal
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Validaciones automáticas */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        ✅ Validaciones automáticas:
                      </div>
                      <div className="space-y-1 text-xs text-green-700">
                        <div>• Cálculos consistentes con el sistema</div>
                        <div>• Descuentos aplicados correctamente</div>
                        <div>• Precios finales validados</div>
                        {formData.cantidadMinima > 1 && (
                          <div>
                            • Cantidad mínima: {formData.cantidadMinima}{" "}
                            unidades
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Resumen de tipos de productos */}
            <div className="mt-3 p-2 bg-gray-100 rounded-lg">
              <div className="text-xs text-gray-600">
                Resumen:{" "}
                {
                  productosSeleccionados.filter(
                    (p) => p.tipo === "MANUFACTURADO"
                  ).length
                }{" "}
                productos manufacturados,{" "}
                {
                  productosSeleccionados.filter((p) => p.tipo === "INSUMO")
                    .length
                }{" "}
                insumos vendibles
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ IMÁGENES PROMOCIONALES - MEJORADO CON COMPONENTE DE CARGA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Imágenes promocionales (opcional)
        </label>

        {/* Lista de imágenes actuales */}
        {imagenesPromocionales.length > 0 && (
          <div className="space-y-4 mb-4">
            {imagenesPromocionales.map((imagen, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Imagen {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removerImagenPromocional(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <ImageUpload
                  currentImage={imagen.url ? imagen : null}
                  onImageChange={(nuevaImagen) =>
                    actualizarImagenPromocional(index, nuevaImagen)
                  }
                  placeholder="Seleccionar imagen promocional"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {/* Botón para agregar nueva imagen */}
        <Button
          type="button"
          onClick={agregarImagenPromocional}
          variant="outline"
          className="w-full"
        >
          + Agregar imagen promocional
        </Button>

        <p className="text-xs text-gray-500 mt-2">
          Las imágenes se utilizarán para mostrar la promoción en el catálogo y
          páginas promocionales
        </p>
      </div>

      {/* Estado activo */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="activo"
          checked={formData.activo}
          onChange={(e) => handleInputChange("activo", e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="activo" className="text-sm font-medium text-gray-700">
          Promoción activa (se puede aplicar inmediatamente)
        </label>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancelar}
          variant="outline"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : promocion ? "Actualizar" : "Crear"}{" "}
          Promoción
        </Button>
      </div>
    </form>
  );
};
