# El Buen Sabor - Sistema de Gestión de Restaurant

Sistema completo de gestión de restaurant con delivery desarrollado en React TypeScript, que incluye administración de inventario, catálogo de productos, gestión de pedidos y dashboard para diferentes roles de usuario.

## 🚀 Características Principales

### Frontend (React TypeScript)
- **Interfaz moderna** con Tailwind CSS
- **Gestión completa** de categorías, ingredientes y productos manufacturados
- **Sistema de carrito** con contexto global
- **Autenticación multi-rol** (Cliente, Admin, Cocinero, Delivery, Cajero)
- **Responsive design** para móviles y desktop
- **Modal system** para formularios y confirmaciones

### Funcionalidades por Rol

#### 🛒 **Cliente**
- Catálogo de productos con filtros
- Carrito de compras inteligente
- Gestión de pedidos (Delivery/Take Away)
- Sistema de autenticación y registro
- Historial de pedidos
- Múltiples domicilios de entrega

#### 👨‍💼 **Administrador**
- Dashboard principal con métricas
- Gestión completa de categorías/subcategorías
- Control de ingredientes y stock
- Administración de productos manufacturados
- Recetas con cálculo automático de costos
- Control de márgenes de ganancia

#### 👨‍🍳 **Cocinero**
- Vista de pedidos en preparación
- Gestión de tiempos de cocción
- Control de estado de pedidos

#### 🚚 **Delivery**
- Dashboard de pedidos listos para entrega
- Información completa del cliente y domicilio
- Gestión de entregas con geolocalización

#### 💰 **Cajero**
- Gestión de pedidos y pagos
- Control de ventas

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **React Router DOM** para navegación
- **Tailwind CSS** para estilos
- **Lucide React** para iconografía
- **Context API** para manejo de estado global

### Servicios y APIs
- **Fetch API** para comunicación con backend
- **JWT** para autenticación
- **RESTful API** con manejo de errores centralizado

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Autenticación (Login, Registro)
│   ├── cart/            # Carrito de compras
│   ├── categorias/      # Gestión de categorías
│   ├── common/          # Componentes base (Modal, Table, Button)
│   ├── delivery/        # Dashboard de delivery
│   ├── insumos/         # Gestión de ingredientes
│   ├── layout/          # Layout y navegación
│   └── productos/       # Gestión de productos
├── context/             # Contextos de React
├── hooks/               # Custom hooks
├── pages/               # Páginas principales
├── services/            # Servicios de API
├── types/               # Tipos TypeScript
└── assets/              # Recursos estáticos
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Backend API ejecutándose en `http://localhost:8080`

### Instalación

1. **Clonar el repositorio**
```bash
git clone [url-del-repositorio]
cd el-buen-sabor-frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Build para producción**
```bash
npm run build
```

## 🔧 Configuración de la API

El frontend está configurado para conectarse a un backend en `http://localhost:8080/api`. 

### Endpoints principales:
- `/auth/login` - Autenticación
- `/clientes` - Gestión de clientes
- `/categorias` - Categorías de productos
- `/articulos-insumo` - Ingredientes
- `/articulos-manufacturados` - Productos
- `/pedidos` - Gestión de pedidos

## 🎨 Componentes Destacados

### Carrito de Compras
```typescript
// Uso del contexto del carrito
const carrito = useCarritoContext();

// Agregar producto
carrito.agregarItem(producto, cantidad);

// Gestión automática de totales y tiempos
console.log(carrito.total, carrito.tiempoEstimadoTotal);
```

### Autenticación Multi-Rol
```typescript
const { isAuthenticated, user } = useAuth();

// Navegación diferenciada por rol
if (user?.rol === 'DELIVERY') {
  navigate('/delivery');
} else if (user?.rol === 'ADMINISTRADOR') {
  navigate('/dashboard');
}
```

### Gestión de Estado
- **Context API** para carrito global
- **Custom hooks** para lógica de negocio
- **TypeScript** para type safety completo

## 📱 Características de UX/UI

### Responsive Design
- Navegación adaptativa por dispositivo
- Layout optimizado para móviles
- Carrito flotante en móviles

### Feedback Visual
- Estados de carga en todas las operaciones
- Notificaciones de éxito/error
- Badges de cantidad en carrito
- Estados visuales de stock

### Accesibilidad
- Contraste optimizado
- Navegación por teclado
- Labels descriptivos
- Estados focus visibles

## 🔐 Sistema de Autenticación

### Flujo de Autenticación
1. Login con email/password
2. Recepción de JWT token
3. Almacenamiento seguro en localStorage
4. Validación automática en cada request
5. Redirección por rol de usuario

### Roles y Permisos
- **CLIENTE**: Catálogo, carrito, pedidos
- **ADMINISTRADOR**: Acceso completo al sistema
- **COCINERO**: Gestión de preparación
- **DELIVERY**: Dashboard de entregas
- **CAJERO**: Gestión de ventas

## 🛒 Sistema de Carrito

### Características
- **Persistencia temporal** durante la sesión
- **Cálculo automático** de totales y tiempos
- **Validación de stock** en tiempo real
- **Gestión de tipos de entrega** (Delivery/Take Away)
- **Observaciones personalizadas**

### Flujo de Pedido
1. Agregar productos al carrito
2. Seleccionar tipo de entrega
3. Confirmar domicilio (si es delivery)
4. Añadir observaciones
5. Checkout y creación del pedido

## 📊 Gestión de Inventario

### Ingredientes
- Control de stock en tiempo real
- Alertas de stock bajo/crítico
- Precios de compra y venta
- Categorización completa

### Productos Manufacturados
- **Recetas inteligentes** con cálculo de costos
- **Márgenes de ganancia** configurables
- **Stock calculado** basado en ingredientes
- **Tiempos de preparación** estimados

## 🚚 Sistema de Delivery

### Dashboard de Delivery
- Lista de pedidos listos para entrega
- Información completa del cliente
- Datos de contacto y dirección
- Gestión de estado de entregas

### Optimizaciones
- Filtrado automático por zona
- Cálculo de tiempos de entrega
- Estados en tiempo real

## 🧪 Testing y Calidad de Código

### TypeScript
- **Type safety** completo en toda la aplicación
- **Interfaces bien definidas** para todos los DTOs
- **Validación en tiempo de compilación**

### Estructura de Servicios
- **ApiClient base** con manejo de errores
- **Servicios especializados** por entidad
- **Interceptors** para autenticación automática

## 🌟 Funcionalidades Avanzadas

### Cálculo Inteligente de Costos
- Costos automáticos basados en ingredientes
- Márgenes de ganancia configurables
- Alertas de rentabilidad

### Gestión de Stock Inteligente
- Cálculo automático de productos preparables
- Alertas proactivas de reposición
- Estados visuales de disponibilidad

### Sistema de Imágenes
- Soporte para múltiples imágenes por producto
- Fallbacks elegantes para productos sin imagen
- Optimización de carga

## 🔮 Próximas Características

- [ ] Integración con sistemas de pago
- [ ] Notificaciones push para pedidos
- [ ] Sistema de reviews y calificaciones
- [ ] Dashboard de analytics avanzado
- [ ] Integración con APIs de delivery externos
- [ ] Sistema de promociones y descuentos

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

👥 Equipo de Desarrollo
Este proyecto está siendo desarrollado por:

- Franco Garay - @FrancoGarayBenitez
- Luciano Reggio - @LucianoReggio
- Octavio Ragusa - @Octavio1993
- Matias Picón - @Pykon26
- Pedro Giorlando - @PedroGiorlando

📞 Contacto
Para consultas sobre el proyecto, puedes contactar a cualquier miembro del equipo de desarrollo a través de sus perfiles de GitHub.

---

**El Buen Sabor** 🍕
