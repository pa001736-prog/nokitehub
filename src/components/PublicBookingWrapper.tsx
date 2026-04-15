import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, getShopIdBySlug, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, collection, addDoc, setDoc } from 'firebase/firestore';
import { Settings, Appointment, BusySlot } from '../types';
import PublicBookingPage from '../pages/PublicBookingPage';
import { motion } from 'motion/react';
import { Toaster } from 'sonner';
import { updateDynamicManifest } from '../lib/pwa';

export default function PublicBookingWrapper() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);

  useEffect(() => {
    async function resolveShop() {
      if (!slug || slug === 'admin' || slug === 'login' || slug === 'super-admin') {
        setLoading(false);
        return;
      }
      const id = await getShopIdBySlug(slug);
      setShopId(id);
      if (!id) {
        setLoading(false);
      }
    }
    resolveShop();
  }, [slug]);

  useEffect(() => {
    if (!shopId) return;

    const unsubSettings = onSnapshot(
      doc(db, 'shops', shopId),
      (docSnap) => {
        if (docSnap.exists()) {
          const settingsData = docSnap.data() as Settings;
          setSettings(settingsData);
          setLoading(false); // Only stop loading after settings are here
          
          // Update PWA Manifest asynchronously
          setTimeout(() => {
            updateDynamicManifest(settingsData.shopName, settingsData.shopLogo);
          }, 100);
        } else {
          setLoading(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `shops/${shopId}`);
        setLoading(false);
      }
    );

    const unsubBusySlots = onSnapshot(
      collection(db, 'shops', shopId, 'busy_slots'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusySlot));
        setBusySlots(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/busy_slots`)
    );

    return () => {
      unsubSettings();
      unsubBusySlots();
    };
  }, [shopId]);

  const addAppointment = async (appointment: Appointment) => {
    if (!shopId) return;
    try {
      const { id, ...rest } = appointment;
      const { writeBatch, doc, collection } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      // Generate a clean ID for the appointment
      const appointmentRef = doc(collection(db, 'shops', shopId, 'appointments'));
      const appointmentId = appointmentRef.id;

      // Create appointment
      batch.set(appointmentRef, { 
        ...rest, 
        company_id: shopId,
        createdAt: new Date().toISOString() 
      });

      // Create busy slot (ID is date_time to prevent collisions)
      const slotId = `${appointment.date}_${appointment.time}`;
      const slotRef = doc(db, 'shops', shopId, 'busy_slots', slotId);
      batch.set(slotRef, {
        date: appointment.date,
        time: appointment.time,
        appointmentId: appointmentId,
        company_id: shopId
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shops/${shopId}/appointments`);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Carregando Barbearia...</p>
        </div>
      </div>
    );
  }

  if (!shopId || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Barbearia não encontrada</h2>
          <p className="text-slate-500 font-medium">O link que você acessou pode estar incorreto ou a barbearia não existe mais.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PublicBookingPage 
        shopId={shopId}
        settings={settings}
        busySlots={busySlots}
        onAddAppointment={addAppointment}
      />
      <Toaster position="top-center" richColors />
    </>
  );
}
