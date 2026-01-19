
import React, { useState, useEffect, Suspense } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { PasswordModal } from './components/PasswordModal';
import { Login } from './components/Login';
import { PageView, Product, Employee, DocumentFile, KPIData, CompanySettings, UserRole, ReservedItem, LabDevice } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Database as DbIcon, Loader2, Menu, LogOut } from 'lucide-react';

// Lazy Load Components
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Products = React.lazy(() => import('./components/Products').then(module => ({ default: module.Products })));
const Team = React.lazy(() => import('./components/Team').then(module => ({ default: module.Team })));
const KPIs = React.lazy(() => import('./components/KPIs').then(module => ({ default: module.KPIs })));
const LabEquipment = React.lazy(() => import('./components/LabEquipment').then(module => ({ default: module.LabEquipment })));
const Documents = React.lazy(() => import('./components/Documents').then(module => ({ default: module.Documents })));
const About = React.lazy(() => import('./components/About').then(module => ({ default: module.About })));
const Database = React.lazy(() => import('./components/Database').then(module => ({ default: module.Database })));
const CompanySettingsPanel = React.lazy(() => import('./components/CompanySettings').then(module => ({ default: module.CompanySettingsPanel })));

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  name: '',
  slogan: '',
  address: '',
  logo: '',
  email: '',
  phone: '',
  website: '',
  registrationNumber: '',
  certificates: ''
};

localforage.config({
  name: 'TQM_Pro_System',
  storeName: 'quality_data'
});

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-royal-600">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
      <Loader2 className="w-12 h-12" />
    </motion.div>
    <p className="mt-4 font-bold text-gray-500 animate-pulse">جاري تحميل البيانات...</p>
  </div>
);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [team, setTeam] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);
  const [labEquipment, setLabEquipment] = useState<LabDevice[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_COMPANY_SETTINGS);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, t, d, k, c, r, l] = await Promise.all([
          localforage.getItem<Product[]>('tqm_products'),
          localforage.getItem<Employee[]>('tqm_team'),
          localforage.getItem<DocumentFile[]>('tqm_documents'),
          localforage.getItem<KPIData[]>('tqm_kpiData'),
          localforage.getItem<CompanySettings>('tqm_company'),
          localforage.getItem<ReservedItem[]>('tqm_reserved'),
          localforage.getItem<LabDevice[]>('tqm_lab_equipment')
        ]);
        if (p) setProducts(p);
        if (t) setTeam(t);
        if (d) setDocuments(d);
        if (k) setKpiData(k);
        if (c) setCompanySettings(c);
        if (r) setReservedItems(r);
        if (l) setLabEquipment(l);
      } catch (err) {
        console.error("Storage Error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_products', products); }, [products, isInitializing]);
  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_team', team); }, [team, isInitializing]);
  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_documents', documents); }, [documents, isInitializing]);
  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_kpiData', kpiData); }, [kpiData, isInitializing]);
  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_company', companySettings); }, [companySettings, isInitializing]);
  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_reserved', reservedItems); }, [reservedItems, isInitializing]);
  useEffect(() => { if (!isInitializing) localforage.setItem('tqm_lab_equipment', labEquipment); }, [labEquipment, isInitializing]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestAuth = (action: () => void) => {
    if (userRole === 'admin') action();
    else {
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-royal-950 flex flex-col items-center justify-center text-white text-center" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-royal-400 mb-4" />
        <h1 className="text-xl font-bold">جاري تشغيل النظام...</h1>
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={(role) => { setUserRole(role); setIsAuthenticated(true); }} />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir="rtl">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        companySettings={companySettings}
        role={userRole}
      />
      
      <main className="flex-1 p-4 lg:p-10 w-full">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-royal-50 text-gray-700 hover:text-royal-600 transition-colors shadow-sm"
                aria-label="القائمة الرئيسية"
            >
                <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 truncate">
                {currentView === 'dashboard' && 'الصفحة الرئيسية'}
                {currentView === 'products' && 'إدارة المنتجات'}
                {currentView === 'team' && 'فريق العمل'}
                {currentView === 'kpi' && 'تحليلات الأداء'}
                {currentView === 'lab-equipment' && 'أجهزة المعمل و SOP'}
                {currentView === 'documents' && 'مركز الوثائق'}
                {currentView === 'database' && 'قاعدة البيانات'}
                {currentView === 'settings' && 'إعدادات المنشأة'}
                {currentView === 'about' && 'حول النظام'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-400">حساب {userRole === 'admin' ? 'الإدارة' : 'زائر'}</span>
                <span className="text-sm font-black text-gray-800">نشط الآن</span>
             </div>
             <button 
                onClick={() => { setIsAuthenticated(false); setUserRole(null); }} 
                className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-100"
                title="تسجيل الخروج"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
            {currentView === 'dashboard' && (
              <Dashboard 
                products={products} 
                kpiData={kpiData} 
                handleGenerateReport={() => window.print()} 
                navigate={setCurrentView}
                reservedItems={reservedItems}
                setReservedItems={setReservedItems}
                role={userRole}
                requestAuth={requestAuth}
              />
            )}
            {currentView === 'products' && <Products products={products} setProducts={setProducts} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'team' && <Team team={team} setTeam={setTeam} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'kpi' && <KPIs data={kpiData} setData={setKpiData} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'lab-equipment' && <LabEquipment devices={labEquipment} setDevices={setLabEquipment} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'documents' && <Documents documents={documents} setDocuments={setDocuments} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'settings' && <CompanySettingsPanel settings={companySettings} onSave={setCompanySettings} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'database' && <Database data={{ products, team, documents, kpiData, companySettings, reservedItems, labEquipment }} onImport={(d) => { setProducts(d.products || []); setTeam(d.team || []); setKpiData(d.kpiData || []); setCompanySettings(d.companySettings || INITIAL_COMPANY_SETTINGS); if(d.reservedItems) setReservedItems(d.reservedItems); if(d.labEquipment) setLabEquipment(d.labEquipment); }} onReset={() => { setProducts([]); setTeam([]); setKpiData([]); setReservedItems([]); setLabEquipment([]); }} requestAuth={requestAuth} role={userRole} />}
            {currentView === 'about' && <About />}
        </Suspense>
      </main>

      <PasswordModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onConfirm={() => { pendingAction?.(); setPendingAction(null); }} />
    </div>
  );
}

export default App;