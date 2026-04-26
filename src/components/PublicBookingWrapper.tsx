import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, getShopIdBySlug, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, collection, getDocs, query, where, setDoc, writeBatch } from 'firebase/firestore';
import { Settings, Appointment, BusySlot, Professional, Client } from '../types';
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
  const [professionals, setProfessionals] = useState<Professional[]>([]);

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
          
          // Update PWA Manifest asynchronously
          setTimeout(() => {
            updateDynamicManifest(settingsData.shopName, settingsData.shopLogo);
          }, 100);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `shops/${shopId}`);
      }
    );

    const unsubProfessionals = onSnapshot(
      query(collection(db, 'shops', shopId, 'professionals'), where('active', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional));
        setProfessionals(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/professionals`)
    );

    const unsubBusySlots = onSnapshot(
      collection(db, 'shops', shopId, 'busy_slots'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusySlot));
        setBusySlots(data);
        
        // At this point we have at least tried to load everything crucial
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/busy_slots`);
        setLoading(false);
      }
    );

    return () => {
      unsubSettings();
      unsubProfessionals();
      unsubBusySlots();
    };
  }, [shopId]);

  const addAppointment = async (appointment: Appointment) => {
    if (!shopId) return;
    try {
      const { id, ...rest } = appointment;
      const { writeBatch, doc, collection, getDocs, query, where, increment } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      // 1. Create appointment
      const appointmentRef = doc(collection(db, 'shops', shopId, 'appointments'));
      const appointmentId = appointmentRef.id;

      batch.set(appointmentRef, { 
        ...rest, 
        company_id: shopId,
        createdAt: new Date().toISOString() 
      });

      // 2. Create busy slot unique to the professional
      const slotId = `${appointment.date}_${appointment.time}_${appointment.professionalId}`;
      const slotRef = doc(db, 'shops', shopId, 'busy_slots', slotId);
      batch.set(slotRef, {
        date: appointment.date,
        time: appointment.time,
        appointmentId: appointmentId,
        professionalId: appointment.professionalId,
        company_id: shopId
      });

      // 3. Upsert Client (create or update visit count)
      if (appointment.phone) {
        const clientsRef = collection(db, 'shops', shopId, 'clients');
        const q = query(clientsRef, where('phone', '==', appointment.phone));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
           // Create new client
           const newClientRef = doc(clientsRef);
           batch.set(newClientRef, {
             name: appointment.clientName,
             phone: appointment.phone,
             cpf: appointment.cpf || null,
             totalAppointments: 1,
             lastVisit: appointment.date,
             createdAt: new Date().toISOString(),
             company_id: shopId
           });
        } else {
           // Update existing
           const existingClientDoc = querySnapshot.docs[0];
           batch.update(existingClientDoc.ref, {
             totalAppointments: increment(1),
             lastVisit: appointment.date,
             name: appointment.clientName // Update name in case they changed it
           });
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shops/${shopId}/appointments|clients`);
      throw error; // Re-throw to handle in UI
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
        professionals={professionals}
        onAddAppointment={addAppointment}
      />
      <Toaster position="top-center" richColors />
    </>
  );
}
