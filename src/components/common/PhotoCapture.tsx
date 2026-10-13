import React, {useRef} from 'react';
import {Camera, Image as ImageIcon, Trash2} from 'lucide-react';

interface PhotoCaptureProps {
  label?: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  label = 'Fotografías / Evidencias',
  photos,
  onChange,
  maxPhotos = 3,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (photos.length >= maxPhotos) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Compress via Canvas to keep database lightweight
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 800;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              onChange([...photos, compressedBase64]);
            }
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        <span className="text-xs text-slate-400">
          {photos.length} / {maxPhotos}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {photos.map((src, index) => (
          <div
            key={index}
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-sm group bg-slate-100"
          >
            <img src={src} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100 transition shadow"
              title="Eliminar foto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition gap-1"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-medium">Adjuntar</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
