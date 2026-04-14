import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Truck, 
  QrCode, 
  FileText,
  TrendingUp,
  Search,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Zap,
  Minus,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Types ---
type Role = 'customer' | 'clerk' | 'admin';

interface User {
  id: number;
  email: string;
  role: Role;
  name: string;
}

interface Medication {
  id: number;
  name: string;
  concentration: string;
  presentation: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  batch?: string;
  expiration_date?: string;
}

interface Order {
  id: number;
  customer_id: number;
  customer_name?: string;
  status: 'created' | 'preparing' | 'ready' | 'delivered';
  type: 'pickup' | 'delivery';
  total: number;
  shipping_fee?: number;
  address?: string;
  phone?: string;
  reference?: string;
  created_at: string;
  slip_path: string | null;
  payment_confirmed: number;
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const variants: any = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    bitcoin: 'bg-orange-500 text-white hover:bg-orange-600'
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    bitcoin: 'bg-orange-100 text-orange-700'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<string>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="logo.png" 
                alt="BitFarma Logo" 
                className="h-24 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-gray-500 mt-2">Bienvenido de nuevo, por favor inicia sesión</p>
          </div>

          <Card>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  placeholder="ejemplo@farmacia.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input 
                  name="password"
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full py-4" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">Cuentas de Prueba</p>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                <p>Admin: admin@farmacia.com / admin123</p>
                <p>Dependiente: clerk@farmacia.com / clerk123</p>
                <p>Cliente: cliente@gmail.com / user123</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">Bit<span className="text-blue-600">Farma</span></span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Panel Principal"
          />
          {user.role === 'customer' && (
            <>
              <NavItem 
                active={view === 'new-order'} 
                onClick={() => setView('new-order')}
                icon={<ShoppingCart size={20} />}
                label="Nuevo Pedido"
              />
              <NavItem 
                active={view === 'my-orders'} 
                onClick={() => setView('my-orders')}
                icon={<Clock size={20} />}
                label="Mis Pedidos"
              />
            </>
          )}
          {user.role === 'clerk' && (
            <NavItem 
              active={view === 'manage-orders'} 
              onClick={() => setView('manage-orders')}
              icon={<FileText size={20} />}
              label="Gestionar Pedidos"
            />
          )}
          {user.role === 'admin' && (
            <>
              <NavItem 
                active={view === 'inventory'} 
                onClick={() => setView('inventory')}
                icon={<Package size={20} />}
                label="Inventario"
              />
              <NavItem 
                active={view === 'reports'} 
                onClick={() => setView('reports')}
                icon={<TrendingUp size={20} />}
                label="Reportes de Ventas"
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600 w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="w-full">
            <LogOut size={18} /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && <Dashboard user={user} setView={setView} />}
          {view === 'new-order' && <NewOrder user={user} setView={setView} />}
          {view === 'my-orders' && <MyOrders user={user} />}
          {view === 'manage-orders' && <ManageOrders user={user} />}
          {view === 'inventory' && <Inventory user={user} />}
          {view === 'reports' && <Reports user={user} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600 font-bold' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
    </button>
  );
}

// --- View Components ---

function Dashboard({ user, setView }: any) {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const roleParam = user.role === 'customer' ? `role=customer&userId=${user.id}` : `role=${user.role}`;
    fetch(`/api/orders?${roleParam}`).then(r => r.json()).then(data => setRecentOrders(data.slice(0, 5)));
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">¡Hola, {user.name}!</h2>
          <p className="text-gray-500">Bienvenido al sistema de BitFarma.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-600">Sistema Operativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.role === 'customer' && (
          <>
            <QuickAction 
              icon={<ShoppingCart className="text-blue-600" />}
              title="Nuevo Pedido"
              desc="Sube tu receta y ordena medicamentos"
              onClick={() => setView('new-order')}
            />
            <QuickAction 
              icon={<Clock className="text-purple-600" />}
              title="Mis Pedidos"
              desc="Revisa el estado de tus compras"
              onClick={() => setView('my-orders')}
            />
            <QuickAction 
              icon={<Zap className="text-orange-500" />}
              title="Pago Bitcoin"
              desc="Paga de forma segura con Lightning"
              onClick={() => setView('my-orders')}
            />
          </>
        )}
        {user.role === 'clerk' && (
          <>
            <QuickAction 
              icon={<FileText className="text-blue-600" />}
              title="Pedidos Pendientes"
              desc="Gestiona las órdenes entrantes"
              onClick={() => setView('manage-orders')}
            />
            <QuickAction 
              icon={<Package className="text-green-600" />}
              title="Preparación"
              desc="Marca órdenes listas para entrega"
              onClick={() => setView('manage-orders')}
            />
          </>
        )}
        {user.role === 'admin' && (
          <>
            <QuickAction 
              icon={<Package className="text-blue-600" />}
              title="Inventario"
              desc="Gestiona stock y precios"
              onClick={() => setView('inventory')}
            />
            <QuickAction 
              icon={<TrendingUp className="text-green-600" />}
              title="Reportes"
              desc="Ventas diarias, semanales y mensuales"
              onClick={() => setView('reports')}
            />
            <QuickAction 
              icon={<AlertTriangle className="text-red-600" />}
              title="Alertas de Stock"
              desc="Revisa productos por agotarse"
              onClick={() => setView('inventory')}
            />
          </>
        )}
      </div>
      
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900">Actividad Reciente</h3>
          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => setView(user.role === 'customer' ? 'my-orders' : 'manage-orders')}>Ver Todo</Button>
        </div>
        <div className="space-y-4">
          {recentOrders.length === 0 && <p className="text-center text-gray-400 py-4">No hay actividad reciente.</p>}
          {recentOrders.map(order => (
            <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => setView(user.role === 'customer' ? 'my-orders' : 'manage-orders')}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-white transition-all ${
                order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {order.status === 'delivered' ? <CheckCircle size={18} /> : <Clock size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Pedido #{order.id} - {order.status.toUpperCase()}</p>
                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function QuickAction({ icon, title, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
    >
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </button>
  );
}

function NewOrder({ user, setView }: any) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [type, setType] = useState<'pickup' | 'delivery'>('pickup');
  const [slip, setSlip] = useState<File | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState({ address: '', phone: '', reference: '' });
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch('/api/medications').then(r => r.json()).then(setMeds);
  }, []);

  const addToCart = (med: Medication) => {
    const existing = cart.find(c => c.id === med.id);
    if (existing) {
      setCart(cart.map(c => c.id === med.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = Math.max(1, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const shippingFee = type === 'delivery' ? 5.00 : 0;
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + shippingFee;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSlip(file);
    if (file) {
      analyzePrescription(file);
    }
  };

  const analyzePrescription = async (file: File) => {
    if (!process.env.GEMINI_API_KEY) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const prompt = "Analiza esta receta médica y extrae los nombres de los medicamentos. Devuelve solo una lista de nombres de medicamentos separados por comas. Si no hay medicamentos, devuelve 'Ninguno'.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: file.type } }
          ]
        }
      });
      
      const text = response.text || "";
      if (text.toLowerCase().includes('ninguno')) return;

      const foundNames = text.split(',').map(s => s.trim().toLowerCase());
      
      // Try to match with our inventory
      const matches = meds.filter(m => 
        foundNames.some(name => m.name.toLowerCase().includes(name) || name.includes(m.name.toLowerCase()))
      );

      if (matches.length > 0) {
        const newItems = matches.filter(m => !cart.find(c => c.id === m.id));
        if (newItems.length > 0) {
          setCart(prev => [...prev, ...newItems.map(m => ({ ...m, quantity: 1 }))]);
          alert(`IA detectó y agregó: ${newItems.map(m => m.name).join(', ')}`);
        }
      }
    } catch (err) {
      console.error("Error analizando receta:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return alert('El carrito está vacío');
    if (!slip) return alert('Por favor sube una foto de tu receta');
    if (type === 'delivery' && (!deliveryInfo.address || !deliveryInfo.phone)) {
      return alert('Por favor completa los datos de envío');
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('customer_id', user.id.toString());
    formData.append('type', type);
    formData.append('items', JSON.stringify(cart));
    formData.append('slip', slip);
    formData.append('address', deliveryInfo.address);
    formData.append('phone', deliveryInfo.phone);
    formData.append('reference', deliveryInfo.reference);
    formData.append('shipping_fee', shippingFee.toString());

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setPaymentData(data);
    } catch (err) {
      alert('Error al crear pedido');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    await fetch(`/api/orders/${paymentData.orderId}/confirm-payment`, { method: 'POST' });
    alert('¡Pago confirmado! Tu pedido está siendo procesado.');
    setView('my-orders');
  };

  if (paymentData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto">
        <Card className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="text-orange-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Pago con Bitcoin Lightning</h2>
          <p className="text-gray-500 mb-6">Escanea el código QR con tu billetera Lightning para pagar <b>${paymentData.total.toFixed(2)}</b></p>
          
          <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 inline-block mb-6">
            <img src={paymentData.qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
          </div>

          <div className="space-y-3">
            <Button variant="bitcoin" className="w-full py-4" onClick={confirmPayment}>
              Simular Confirmación de Pago
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setPaymentData(null)}>
              Cancelar
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Search className="text-gray-400" size={20} />
            <input 
              placeholder="Buscar medicamentos..." 
              className="flex-1 outline-none text-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meds.map(med => (
              <div key={med.id} className="p-4 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{med.name}</h4>
                    <span className="text-blue-600 font-bold">${med.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{med.concentration} • {med.presentation}</p>
                </div>
                <Button variant="outline" className="w-full text-xs py-2" onClick={() => addToCart(med)}>
                  <Plus size={14} /> Agregar
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-4">Sube tu Receta Médica</h3>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-all cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange}
              disabled={analyzing}
            />
            {analyzing ? (
              <div className="space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-blue-600 font-bold flex items-center justify-center gap-2">
                  <Sparkles size={18} /> IA analizando receta...
                </p>
              </div>
            ) : (
              <>
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-600 font-medium">
                  {slip ? slip.name : 'Haz clic o arrastra la foto de tu receta aquí'}
                </p>
                <p className="text-xs text-gray-400 mt-2">Formatos aceptados: JPG, PNG, PDF (Máx 5MB)</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-8">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <ShoppingCart size={20} /> Resumen del Pedido
          </h3>
          
          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
            {cart.length === 0 && <p className="text-center text-gray-400 py-8">Tu carrito está vacío</p>}
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">${item.price.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {type === 'delivery' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Cargo de Envío</span>
                <span className="font-medium text-green-600">+${shippingFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => setType('pickup')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'pickup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                Recoger
              </button>
              <button 
                onClick={() => setType('delivery')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'delivery' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                Envío
              </button>
            </div>

            {type === 'delivery' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                <input 
                  placeholder="Dirección de envío" 
                  value={deliveryInfo.address}
                  onChange={e => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  placeholder="Teléfono de contacto" 
                  value={deliveryInfo.phone}
                  onChange={e => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  placeholder="Referencia (opcional)" 
                  value={deliveryInfo.reference}
                  onChange={e => setDeliveryInfo({...deliveryInfo, reference: e.target.value})}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </motion.div>
            )}
            
            <Button className="w-full py-4 mt-4" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Procesando...' : 'Proceder al Pago'}
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function MyOrders({ user }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/orders?role=customer&userId=${user.id}`).then(r => r.json()).then(setOrders);
  }, [user.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created': return <Badge variant="info">Creado</Badge>;
      case 'preparing': return <Badge variant="warning">Preparando</Badge>;
      case 'ready': return <Badge variant="success">Listo</Badge>;
      case 'delivered': return <Badge>Entregado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return <Clock className="text-blue-500" />;
      case 'preparing': return <Package className="text-yellow-500" />;
      case 'ready': return <CheckCircle className="text-green-500" />;
      case 'delivered': return <Truck className="text-gray-500" />;
      default: return <Clock />;
    }
  };

  const viewDetails = async (id: number) => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setSelectedOrder(data);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 && (
          <Card className="text-center py-12">
            <Package className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-500">Aún no has realizado ningún pedido.</p>
          </Card>
        )}
        {orders.map(order => (
          <Card key={order.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => viewDetails(order.id)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pedido #{order.id}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 capitalize">{order.type === 'pickup' ? 'Recoger en tienda' : 'Envío a domicilio'}</p>
                </div>
                {getStatusBadge(order.status)}
                <ChevronRight className="text-gray-300" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Detalle del Pedido #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)}><X /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Estado</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pago Bitcoin Lightning</p>
                  {selectedOrder.payment_confirmed ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Confirmado</Badge>
                      <Zap size={14} className="text-orange-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Pendiente</Badge>
                      <Clock size={14} className="text-yellow-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3">Medicamentos</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.concentration} • Cant: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm">${(item.unit_price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-lg font-bold">Total Pagado</span>
                <span className="text-2xl font-bold text-blue-600">${selectedOrder.total.toFixed(2)}</span>
              </div>
              
              <Button variant="secondary" className="w-full" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ManageOrders({ user }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = () => {
    fetch('/api/orders?role=clerk').then(r => r.json()).then(setOrders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchOrders();
    if (selectedOrder && selectedOrder.id === id) {
      viewDetails(id);
    }
  };

  const viewDetails = async (id: number) => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setSelectedOrder(data);
  };

  const getFlowColor = (currentStatus: string, stepStatus: string) => {
    const steps = ['created', 'preparing', 'ready', 'delivered'];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(stepStatus);
    
    if (currentIndex >= stepIndex) return 'text-blue-600 bg-blue-100';
    return 'text-gray-300 bg-gray-50';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
        <Button variant="secondary" onClick={fetchOrders}><Clock size={18} /> Actualizar</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => (
          <Card key={order.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => viewDetails(order.id)}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">Pedido #{order.id}</p>
                    <Badge variant={order.payment_confirmed ? 'success' : 'warning'}>
                      {order.payment_confirmed ? 'Pagado' : 'Pago Pendiente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Cliente: {order.customer_name}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Flow Icons */}
                <div className="hidden md:flex items-center gap-2">
                  <div className={`p-2 rounded-full ${getFlowColor(order.status, 'created')}`} title="Creado">
                    <Clock size={16} />
                  </div>
                  <div className="w-4 h-0.5 bg-gray-100" />
                  <div className={`p-2 rounded-full ${getFlowColor(order.status, 'preparing')}`} title="Preparando">
                    <Package size={16} />
                  </div>
                  <div className="w-4 h-0.5 bg-gray-100" />
                  <div className={`p-2 rounded-full ${getFlowColor(order.status, 'ready')}`} title="Listo">
                    <CheckCircle size={16} />
                  </div>
                  <div className="w-4 h-0.5 bg-gray-100" />
                  <div className={`p-2 rounded-full ${getFlowColor(order.status, 'delivered')}`} title="Entregado">
                    <Truck size={16} />
                  </div>
                </div>

                <div className="text-right mr-4">
                  <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 capitalize">{order.type}</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Gestión de Pedido #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)}><X /></button>
            </div>
            <div className="p-6 space-y-8">
              {/* Flow Progress */}
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getFlowColor(selectedOrder.status, 'created')}`}>
                    <Clock size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-500">Creado</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${['preparing', 'ready', 'delivered'].includes(selectedOrder.status) ? 'bg-blue-600' : 'bg-gray-100'}`} />
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getFlowColor(selectedOrder.status, 'preparing')}`}>
                    <Package size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-500">Preparando</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${['ready', 'delivered'].includes(selectedOrder.status) ? 'bg-blue-600' : 'bg-gray-100'}`} />
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getFlowColor(selectedOrder.status, 'ready')}`}>
                    <CheckCircle size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-500">Listo</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${selectedOrder.status === 'delivered' ? 'bg-blue-600' : 'bg-gray-100'}`} />
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getFlowColor(selectedOrder.status, 'delivered')}`}>
                    <Truck size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-500">Entregado</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-b pb-2">Información del Cliente</h4>
                  <p className="text-sm"><b>Nombre:</b> {selectedOrder.customer_name}</p>
                  <p className="text-sm"><b>Tipo:</b> <span className="capitalize">{selectedOrder.type}</span></p>
                  {selectedOrder.type === 'delivery' && (
                    <>
                      <p className="text-sm"><b>Dirección:</b> {selectedOrder.address}</p>
                      <p className="text-sm"><b>Teléfono:</b> {selectedOrder.phone}</p>
                      <p className="text-sm"><b>Referencia:</b> {selectedOrder.reference}</p>
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-b pb-2">Medicamentos</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <span>{item.name} ({item.concentration}) x{item.quantity}</span>
                        <span className="font-bold">${(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t flex justify-between font-bold">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center pt-6 border-t">
                {selectedOrder.status === 'created' && (
                  <Button variant="primary" className="px-8 py-3" onClick={() => updateStatus(selectedOrder.id, 'preparing')}>
                    Empezar Preparación
                  </Button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <Button variant="success" className="px-8 py-3" onClick={() => updateStatus(selectedOrder.id, 'ready')}>
                    Marcar como Listo para Entrega
                  </Button>
                )}
                {selectedOrder.status === 'ready' && (
                  <Button variant="outline" className="px-8 py-3" onClick={() => updateStatus(selectedOrder.id, 'delivered')}>
                    Confirmar Entrega Final
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function Inventory({ user }: any) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const fetchMeds = () => {
    fetch('/api/medications').then(r => r.json()).then(setMeds);
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    const url = editing?.id ? `/api/medications/${editing.id}` : '/api/medications';
    const method = editing?.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setEditing(null);
    fetchMeds();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventario de Medicamentos</h2>
        <Button onClick={() => setEditing({})}>
          <Plus size={18} /> Nuevo Medicamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meds.map(med => (
          <Card key={med.id} className={med.quantity <= med.low_stock_threshold ? 'border-red-200 bg-red-50/30' : ''}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-gray-900">{med.name}</h4>
                <p className="text-xs text-gray-500">{med.concentration} • {med.presentation}</p>
              </div>
              <Button variant="secondary" className="p-2" onClick={() => setEditing(med)}>
                <FileText size={14} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Stock</p>
                <p className={`text-lg font-bold ${med.quantity <= med.low_stock_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                  {med.quantity}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Precio</p>
                <p className="text-lg font-bold text-blue-600">${med.price.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Lote</p>
                <p className="text-sm font-medium text-gray-700">{med.batch || 'N/A'}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Vence</p>
                <p className="text-sm font-medium text-gray-700">{med.expiration_date || 'N/A'}</p>
              </div>
            </div>

            {med.quantity <= med.low_stock_threshold && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-100 p-2 rounded-lg">
                <AlertTriangle size={14} /> STOCK BAJO
              </div>
            )}
          </Card>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold mb-6">{editing.id ? 'Editar' : 'Nuevo'} Medicamento</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input name="name" defaultValue={editing.name} required className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Concentración</label>
                  <input name="concentration" defaultValue={editing.concentration} required className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Presentación</label>
                  <input name="presentation" defaultValue={editing.presentation} required className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad</label>
                  <input name="quantity" type="number" defaultValue={editing.quantity} required className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio</label>
                  <input name="price" type="number" step="0.01" defaultValue={editing.price} required className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lote</label>
                  <input name="batch" defaultValue={editing.batch} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimiento</label>
                  <input name="expiration_date" type="date" defaultValue={editing.expiration_date} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Umbral Stock Bajo</label>
                  <input name="low_stock_threshold" type="number" defaultValue={editing.low_stock_threshold || 10} required className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Guardar</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function Reports({ user }: any) {
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/reports/sales?period=${period}`).then(r => r.json()).then(setReport);
    fetch('/api/reports/orders').then(r => r.json()).then(setOrderStats);
  }, [period]);

  if (!report || !orderStats) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Reportes de Ventas</h2>
        <div className="flex p-1 bg-gray-100 rounded-xl">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button 
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all capitalize ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white border-none shadow-blue-200 shadow-xl">
          <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Ventas Totales</p>
          <p className="text-4xl font-bold">${report.grandTotal.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs">
            <TrendingUp size={14} /> +12% vs periodo anterior
          </div>
        </Card>
        
        <Card>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Pedidos Completados</p>
          <p className="text-4xl font-bold text-gray-900">{report.sales.length}</p>
        </Card>

        <Card>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Ticket Promedio</p>
          <p className="text-4xl font-bold text-gray-900">
            ${report.sales.length > 0 ? (report.grandTotal / report.sales.length).toFixed(2) : '0.00'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-lg mb-6">Estado de Pedidos</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pendientes</span>
              <Badge variant="info">{orderStats.pending}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En Preparación</span>
              <Badge variant="warning">{orderStats.preparing}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Listos</span>
              <Badge variant="success">{orderStats.ready}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Entregados</span>
              <Badge>{orderStats.delivered}</Badge>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-red-600 font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> Críticos (+24h)
              </span>
              <Badge variant="danger">{orderStats.older_than_24h}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-6">Desglose por Medicamento</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase font-bold border-b border-gray-100">
                  <th className="pb-4 font-bold">Medicamento</th>
                  <th className="pb-4 font-bold text-center">Cant.</th>
                  <th className="pb-4 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.sales.map((item: any, i: number) => (
                  <tr key={i} className="group">
                    <td className="py-4 font-bold text-gray-900">{item.name}</td>
                    <td className="py-4 text-center text-gray-600">{item.total_quantity}</td>
                    <td className="py-4 text-right font-bold text-blue-600">${item.total_sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
