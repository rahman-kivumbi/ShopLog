import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScannerModal } from './components/ScannerModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PinLockModal } from './components/PinLockModal';
import { BusinessModal } from './components/views/BusinessModal';
import { SettingsModal } from './components/views/SettingsModal';
import { AddProductModal } from './components/AddProductModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';

import { HomeView } from './components/views/HomeView';
import { SellView } from './components/views/SellView';
import { StockView } from './components/views/StockView';
import { PeopleView } from './components/views/PeopleView';
import { MoreView } from './components/views/MoreView';

import { Sale } from './types';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerIsImeiMode, setScannerIsImeiMode] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannerCallback, setScannerCallback] = useState<((code: string) => void) | null>(null);

  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenScanner = (imeiMode = false) => {
    setScannerCallback(null);
    setScannerIsImeiMode(imeiMode);
    setIsScannerOpen(true);
  };

  const handleOpenScannerForBarcode = (callback: (code: string) => void) => {
    setScannerCallback(() => callback);
    setScannerIsImeiMode(false);
    setIsScannerOpen(true);
  };

  const handleScanResult = (text: string) => {
    setIsScannerOpen(false);

    // If an arbitrary input requested the scan (e.g. AddProduct SKU or IMEI row)
    if (scannerCallback) {
      scannerCallback(text);
      setScannerCallback(null);
      return;
    }

    setScannedCode(text);

    // If on home or stock, open appropriate view or auto-search
    if (activeTab === 'home') {
      setActiveTab('sell');
    }
  };

  const handleSaleComplete = (sale: Sale) => {
    setActiveReceiptSale(sale);
  };

  return (
    <div className="min-h-screen bg-[#090c12] text-slate-100 flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-[#f3e5ab]">
      {/* Top Header */}
      <Header
        onOpenBusinessModal={() => setIsBusinessModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className={`flex-1 w-full mx-auto p-3 sm:p-4 transition-all duration-200 ${activeTab === 'sell' ? 'max-w-7xl' : 'max-w-2xl'}`}>
        {activeTab === 'home' && (
          <HomeView
            onOpenScanner={() => handleOpenScanner(false)}
            onOpenNewProduct={() => setIsAddProductOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'sell' && (
          <SellView
            onOpenScanner={() => handleOpenScanner(false)}
            onSaleComplete={handleSaleComplete}
            initialScannedCode={scannedCode}
            onClearScannedCode={() => setScannedCode(null)}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            onOpenScanner={(imeiMode) => handleOpenScanner(imeiMode)}
            onOpenAddProductModal={() => setIsAddProductOpen(true)}
            scannedCode={scannedCode}
            onClearScannedCode={() => setScannedCode(null)}
          />
        )}

        {activeTab === 'people' && <PeopleView />}

        {activeTab === 'more' && (
          <MoreView
            onOpenBusinessModal={() => setIsBusinessModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Google Cloud Account & Sync Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Add Product 3-Tab Modal with SKU Camera Barcode Scanning */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onOpenScannerForBarcode={handleOpenScannerForBarcode}
      />

      {/* Camera Barcode & IMEI Scanner */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScannerCallback(null);
        }}
        onScan={handleScanResult}
        isImeiMode={scannerIsImeiMode}
        title={scannerIsImeiMode ? 'Scan Phone IMEI (15 Digits)' : 'Scan Barcode or Product SKU'}
      />

      {/* Sale Receipt & WhatsApp Sharing Modal */}
      <ReceiptModal
        sale={activeReceiptSale}
        isOpen={!!activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
      />

      {/* Counter Security 4-Digit PIN Lock Overlay */}
      <PinLockModal />

      {/* Business Switcher & Creation Modal */}
      <BusinessModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
      />

      {/* Settings, PIN Setup & JSON Backup Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
