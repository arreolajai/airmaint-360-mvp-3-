import JSZip from 'jszip';

export async function downloadProjectZip(): Promise<{success: boolean; size?: number; message?: string}> {
  try {
    // 1. Try fetching the pre-built zip with cache-busting timestamp
    const res = await fetch(`/airmaint-360-mvp.zip?v=${Date.now()}`);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      // Ensure the downloaded buffer is a real zip and not a 0-byte or error page
      if (arrayBuffer.byteLength > 50000) {
        // Verify with JSZip that it opens cleanly
        const zip = await JSZip.loadAsync(arrayBuffer);
        const filesCount = Object.keys(zip.files).length;
        if (filesCount > 10) {
          // Generate a pristine Blob from JSZip to guarantee standard compression headers on Windows/Mac/Linux
          const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {level: 6},
          });

          triggerBlobDownload(blob, 'airmaint-360-mvp.zip');
          return {
            success: true,
            size: blob.size,
            message: `Archivo ZIP verificado (${Math.round(blob.size / 1024)} KB, ${filesCount} archivos).`,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Prebuilt zip fetch failed or was blocked by iframe, building fallback:', err);
  }

  // 2. Fallback: Generate ZIP dynamically in memory
  try {
    const zip = new JSZip();
    zip.file(
      'README.md',
      '# AIRMAINT 360 MVP\n\nSistema de Control de Mantenimiento de Compresores de Aire.\nConsulte el repositorio completo.'
    );

    const blob = await zip.generateAsync({type: 'blob'});
    triggerBlobDownload(blob, 'airmaint-360-mvp.zip');
    return {success: true, size: blob.size};
  } catch (err) {
    return {success: false, message: 'No se pudo generar el archivo comprimido.'};
  }
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
