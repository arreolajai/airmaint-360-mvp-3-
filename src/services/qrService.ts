import QRCode from 'qrcode';
import type {Compressor} from '../types';

export async function generateCompressorQRDataUrl(compressor: Compressor): Promise<string> {
  const qrPayload = JSON.stringify({
    app: 'AIRMAINT-360',
    id: compressor.id,
    code: compressor.code,
    name: compressor.name,
    serialNumber: compressor.serialNumber,
  });

  try {
    return await QRCode.toDataURL(qrPayload, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
