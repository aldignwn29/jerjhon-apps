import { useState, useEffect, useCallback } from 'react';

export interface HardwareDevice {
  id: string;
  name: string;
  type: 'printer' | 'scanner' | 'edc' | 'drawer';
  interfaceType: 'USB' | 'Bluetooth' | 'WiFi';
  status: 'connected' | 'disconnected' | 'pairing';
  details?: string;
}

export function useHardwareMonitor() {
  const [devices, setDevices] = useState<HardwareDevice[]>([
    { id: 'p1', name: 'USB Thermal Printer (Epson TM-T82 / XP-58IIH)', type: 'printer', interfaceType: 'USB', status: 'connected', details: 'Vendor ID: 0x0483, Product ID: 0x5740' },
    { id: 's1', name: 'USB Laser Barcode Scanner (Honeywell Voyager 1200g)', type: 'scanner', interfaceType: 'USB', status: 'connected', details: 'HID Keyboard Emulation Mode' },
    { id: 'e1', name: 'BCA EDC Payment Terminal', type: 'edc', interfaceType: 'WiFi', status: 'connected', details: 'IP: 192.168.1.108 - Port 9100' },
    { id: 'd1', name: 'RJ11 Cash Drawer Kick', type: 'drawer', interfaceType: 'USB', status: 'connected', details: 'Connected via Printer Port' }
  ]);

  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = useCallback((title: string, desc: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ title, desc, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // WebUSB and Web Bluetooth API integration with fallback simulation
  useEffect(() => {
    const handleUSBConnect = (event: any) => {
      const deviceName = event.device?.productName || 'USB Thermal / Scanner Device';
      showToast('Perangkat USB Terdeteksi!', `Alat baru tersambung via USB: ${deviceName}`, 'success');
      setDevices(prev => prev.map(d => d.interfaceType === 'USB' ? { ...d, status: 'connected' } : d));
    };

    const handleUSBDisconnect = (event: any) => {
      const deviceName = event.device?.productName || 'Perangkat USB';
      showToast('Perangkat USB Terputus', `Koneksi terputus dari ${deviceName}`, 'warning');
      setDevices(prev => prev.map(d => d.interfaceType === 'USB' ? { ...d, status: 'disconnected' } : d));
    };

    if (typeof navigator !== 'undefined' && (navigator as any).usb) {
      try {
        (navigator as any).usb.addEventListener('connect', handleUSBConnect);
        (navigator as any).usb.addEventListener('disconnect', handleUSBDisconnect);

        // Fetch already paired devices
        (navigator as any).usb.getDevices().then((usbDevices: any[]) => {
          if (usbDevices && usbDevices.length > 0) {
            console.log('WebUSB connected devices:', usbDevices);
          }
        }).catch(() => {});
      } catch (e) {
        console.warn('WebUSB listener error:', e);
      }
    }

    return () => {
      if (typeof navigator !== 'undefined' && (navigator as any).usb) {
        try {
          (navigator as any).usb.removeEventListener('connect', handleUSBConnect);
          (navigator as any).usb.removeEventListener('disconnect', handleUSBDisconnect);
        } catch (e) {}
      }
    };
  }, [showToast]);

  const requestWebUSBDevice = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).usb) {
      try {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        const name = device.productName || 'WebUSB POS Device';
        showToast('WebUSB Terhubung Berhasil!', `Berhasil pairing dengan ${name}`, 'success');
        setDevices(prev => prev.map(d => d.type === 'printer' ? { ...d, name: `USB: ${name}`, status: 'connected' } : d));
        return true;
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          showToast('Koneksi USB Dibatalkan', err.message || 'Gagal menyambungkan perangkat USB.', 'warning');
        }
        return false;
      }
    } else {
      showToast('Browser Notice', 'WebUSB API tidak didukung pada browser ini. Menggunakan driver simulasi lokal.', 'info');
      return false;
    }
  };

  const requestWebBluetoothDevice = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
        const name = device.name || 'Bluetooth Printer / Scanner';
        showToast('Web Bluetooth Terhubung!', `Berhasil pairing dengan ${name}`, 'success');
        setDevices(prev => prev.map(d => d.type === 'scanner' ? { ...d, name: `BT: ${name}`, status: 'connected' } : d));
        return true;
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          showToast('Koneksi Bluetooth Dibatalkan', err.message || 'Gagal menyambungkan Bluetooth.', 'warning');
        }
        return false;
      }
    } else {
      showToast('Browser Notice', 'Web Bluetooth API tidak didukung pada browser ini. Menggunakan simulasi wireless.', 'info');
      return false;
    }
  };

  const toggleDeviceStatus = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        const newStatus = d.status === 'connected' ? 'disconnected' : 'connected';
        showToast(
          newStatus === 'connected' ? `Perangkat ${d.name} Terhubung` : `Perangkat ${d.name} Diputus`,
          newStatus === 'connected' ? 'Hardware siap digunakan untuk operasional kasir.' : 'Koneksi perangkat telah dinonaktifkan.',
          newStatus === 'connected' ? 'success' : 'warning'
        );
        return { ...d, status: newStatus };
      }
      return d;
    }));
  };

  return {
    devices,
    toast,
    showToast,
    requestWebUSBDevice,
    requestWebBluetoothDevice,
    toggleDeviceStatus
  };
}
