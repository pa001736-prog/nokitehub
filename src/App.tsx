import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, getUserCompanyId } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion } from 'motion/react';

// Pages & Components
import LoginPage from './pages/LoginPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import AdminDashboard from './components/AdminDashboard';
import PublicBookingWrapper from './components/PublicBookingWrapper';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';

import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFetchingCompany, setIsFetchingCompany] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && u.email) {
        setIsFetchingCompany(true);
        setUser(u);
        if (u.email === 'pa001736@gmail.com') {
          setCompanyId('SUPER_ADMIN');
        } else {
          const cid = await getUserCompanyId(u.uid, u.email);
          setCompanyId(cid);
        }
        setIsFetchingCompany(false);
      } else {
        setUser(null);
        setCompanyId(null);
      }
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isSuperAdmin = user?.email === 'pa001736@gmail.com';
  const isPublicRoute = window.location.pathname.startsWith('/b/') || 
                        (window.location.pathname !== '/' && 
                         window.location.pathname !== '/login' && 
                         window.location.pathname !== '/termos' && 
                         !window.location.pathname.startsWith('/admin') && 
                         !window.location.pathname.startsWith('/super-admin'));

  if ((!isAuthReady || isFetchingCompany) && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* Marketing & Auth */}
        <Route path="/" element={
          !isAuthReady ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
          ) : user ? <Navigate to="/admin" /> : <Navigate to="/login" />
        } />
        <Route path="/login" element={user ? <Navigate to="/admin" /> : <LoginPage onLoginSuccess={() => {}} />} />
        <Route path="/termos" element={<TermsOfUsePage />} />

        {/* Super Admin Route */}
        <Route path="/super-admin/*" element={
          !isAuthReady ? null : (isSuperAdmin ? <SuperAdminDashboard user={user!} /> : <Navigate to="/login" />)
        } />

        {/* Admin Dashboard */}
        <Route path="/admin/*" element={
          !isAuthReady || isFetchingCompany ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
          ) : user ? (
            isSuperAdmin ? <Navigate to="/super-admin" /> : <AdminDashboard user={user} companyId={companyId} />
          ) : <Navigate to="/login" />
        } />

        {/* Public Booking */}
        <Route path="/b/:slug" element={<PublicBookingWrapper />} />

        {/* Fallback for old links or direct slugs */}
        <Route path="/:slug" element={<PublicBookingWrapper />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
    </ErrorBoundary>
  );
}
