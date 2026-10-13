import React, {useState, useEffect} from 'react';
import {X, Cpu, AlertCircle} from 'lucide-react';
import type {Compressor, Criticality, CompressorStatus, AppSettings} from '../../types';
import {PhotoCapture} from '../common/PhotoCapture';

interface CompressorFormModalProps {
  isOpen: boolean;
  compressorToEdit: Compressor | null;
  existingCodes: string[];
  settings: AppSettings | null;
  onClose: () => void;
  onSave: (compressor: Compressor) => Promise<void>;
}

export const CompressorFormModal: React.FC<CompressorFormModalProps> = ({
  isOpen,
  compressorToEdit,
  existingCodes,
  settings,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [plant, setPlant] = useState('Planta Principal');
  const [building, setBuilding] = useState('Nave 1');
  const [area, setArea] = useState('Servicios Auxiliares');
  const [location, setLocation] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [compressorType, setCompressorType] = useState('Tornillo Rotativo');
  const [motorPower, setMotorPower] = useState('100 HP');
  const [capacity, setCapacity] = useState('450 CFM');
  const [nominalPressure, setNominalPressure] = useState('125 PSI');
  const [oilType, setOilType] = useState('Sintético ISO VG 46');
  const [installationDate, setInstallationDate] = useState('');
  const [initialHours, setInitialHours] = useState(0);
  const [currentHours, setCurrentHours] = useState(0);
  const [avgDailyHours, setAvgDailyHours] = useState(16);
  const [criticality, setCriticality] = useState<Criticality>('A');
  const [status, setStatus] = useState<CompressorStatus>('operating');
  const [observations, setObservations] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (compressorToEdit) {
      setCode(compressorToEdit.code);
      setName(compressorToEdit.name);
      setPhotoUrl(compressorToEdit.photoUrl);
      setPlant(compressorToEdit.plant);
      setBuilding(compressorToEdit.building);
      setArea(compressorToEdit.area);
      setLocation(compressorToEdit.location);
      setBrand(compressorToEdit.brand);
      setModel(compressorToEdit.model);
      setSerialNumber(compressorToEdit.serialNumber);
      setCompressorType(compressorToEdit.compressorType);
      setMotorPower(compressorToEdit.motorPower);
      setCapacity(compressorToEdit.capacity);
      setNominalPressure(compressorToEdit.nominalPressure);
      setOilType(compressorToEdit.oilType);
      setInstallationDate(compressorToEdit.installationDate);
      setInitialHours(compressorToEdit.initialHours);
      setCurrentHours(compressorToEdit.currentHours);
      setAvgDailyHours(compressorToEdit.avgDailyHours);
      setCriticality(compressorToEdit.criticality);
      setStatus(compressorToEdit.status);
      setObservations(compressorToEdit.observations || '');
    } else {
      setCode('');
      setName('');
      setPhotoUrl(undefined);
      setPlant(settings?.plantName || 'Planta Principal');
      setBuilding(settings?.buildingsList[0] || 'Nave 1');
      setArea(settings?.areasList[0] || 'Compresores');
      setLocation('');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setCompressorType('Tornillo Rotativo');
      setMotorPower('');
      setCapacity('');
      setNominalPressure('');
      setOilType('Sintético ISO VG 46');
      setInstallationDate(new Date().toISOString().split('T')[0]);
      setInitialHours(0);
      setCurrentHours(0);
      setAvgDailyHours(16);
      setCriticality('B');
      setStatus('operating');
      setObservations('');
    }
    setErrors([]);
  }, [compressorToEdit, isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) validationErrors.push('El código del equipo es obligatorio.');
    if (!name.trim()) validationErrors.push('El nombre del equipo es obligatorio.');
    if (!location.trim()) validationErrors.push('La ubicación es obligatoria.');

    // Unique code validation
    if (!compressorToEdit && existingCodes.includes(cleanCode)) {
      validationErrors.push(`El código ${cleanCode} ya está registrado en otro compresor.`);
    } else if (
      compressorToEdit &&
      cleanCode !== compressorToEdit.code &&
      existingCodes.includes(cleanCode)
    ) {
      validationErrors.push(`El código ${cleanCode} ya pertenece a otro equipo.`);
    }

    if (initialHours < 0) validationErrors.push('El horómetro inicial no puede ser negativo.');
    if (currentHours < 0) validationErrors.push('El horómetro actual no puede ser negativo.');
    if (currentHours < initialHours) {
      validationErrors.push('El horómetro actual no puede ser menor al horómetro inicial.');
    }
    if (avgDailyHours < 0 || avgDailyHours > 24) {
      validationErrors.push('Las horas promedio por día deben estar entre 0 y 24.');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updatedCompressor: Compressor = {
        id: compressorToEdit?.id || `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: cleanCode,
        name: name.trim(),
        photoUrl,
        plant,
        building,
        area,
        location: location.trim(),
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        compressorType,
        motorPower: motorPower.trim(),
        capacity: capacity.trim(),
        nominalPressure: nominalPressure.trim(),
        oilType: oilType.trim(),
        installationDate: installationDate || now.split('T')[0],
        initialHours: Number(initialHours),
        currentHours: Number(currentHours),
        avgDailyHours: Number(avgDailyHours),
        criticality,
        status,
        observations: observations.trim(),
        isActive: true,
        createdAt: compressorToEdit?.createdAt || now,
        updatedAt: now,
        createdBy: compressorToEdit?.createdBy || 'usuario',
        updatedBy: 'usuario',
        deletedAt: null,
        schemaVersion: 1,
      };

      await onSave(updatedCompressor);
      onClose();
    } catch (err) {
      setErrors(['Error al guardar el compresor. Verifique los datos ingresados.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {compressorToEdit ? `Editar Compresor: ${compressorToEdit.code}` : 'Nuevo Compresor de Aire'}
              </h2>
              <p className="text-xs text-slate-400">Catálogo técnico y registro de activo industrial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Por favor corrija los siguientes errores:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sección 1: Identificación y Ubicación */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-1 border-b border-slate-200">
              1. Identificación y Ubicación en Planta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Código del Equipo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: CP-04"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold focus:border-blue-600 focus:outline-none uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Nombre / Denominación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Compresor de Tornillo Kaeser CSD 100"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nave / Edificio *</label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Nave 1"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Área *</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Cuarto de Compresores"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Ubicación / Bahía *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bahía Norte, Muro Este"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Especificaciones Técnicas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-1 border-b border-slate-200">
              2. Ficha Técnica y Fabricante
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Marca</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Atlas Copco, Kaeser..."
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Modelo</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="GA-75 VSD"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Número de Serie</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN-123456"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tipo de Compresor</label>
                <select
                  value={compressorType}
                  onChange={(e) => setCompressorType(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="Tornillo Rotativo">Tornillo Rotativo</option>
                  <option value="Tornillo Rotativo VSD">Tornillo Rotativo VSD</option>
                  <option value="Tornillo Libre de Aceite">Tornillo Libre de Aceite</option>
                  <option value="Pistón Reciprocante">Pistón Reciprocante</option>
                  <option value="Centrífugo">Centrífugo</option>
                  <option value="Scroll">Scroll</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Potencia de Motor</label>
                <input
                  type="text"
                  value={motorPower}
                  onChange={(e) => setMotorPower(e.target.value)}
                  placeholder="100 HP (75 kW)"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Capacidad de Flujo</label>
                <input
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="450 CFM"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Presión Nominal</label>
                <input
                  type="text"
                  value={nominalPressure}
                  onChange={(e) => setNominalPressure(e.target.value)}
                  placeholder="125 PSI"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tipo de Aceite</label>
                <input
                  type="text"
                  value={oilType}
                  onChange={(e) => setOilType(e.target.value)}
                  placeholder="Sintético ISO VG 46"
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Horómetros y Operación */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-1 border-b border-slate-200">
              3. Horómetros y Régimen Operativo
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Horómetro Inicial *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialHours}
                  onChange={(e) => setInitialHours(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Horómetro Actual *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentHours}
                  onChange={(e) => setCurrentHours(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Horas Promedio / Día *</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  required
                  value={avgDailyHours}
                  onChange={(e) => setAvgDailyHours(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Fecha de Instalación</label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Criticidad Operativa</label>
                <select
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value as Criticality)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="A">Categoría A - Crítico (Paro total de planta)</option>
                  <option value="B">Categoría B - Importante (Afecta líneas principales)</option>
                  <option value="C">Categoría C - Soporte / Auxiliar</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Estado Operativo *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CompressorStatus)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none bg-white font-bold"
                >
                  <option value="operating">Operando (En servicio activo)</option>
                  <option value="stopped">Detenido (Apagado / En espera)</option>
                  <option value="maintenance">En Mantenimiento</option>
                  <option value="standby">En Espera (Respaldo)</option>
                  <option value="out_of_service">Fuera de Servicio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 4: Observaciones y Foto */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-1 border-b border-slate-200">
              4. Fotografía y Observaciones
            </h3>

            <PhotoCapture
              label="Fotografía del Compresor"
              photos={photoUrl ? [photoUrl] : []}
              onChange={(photos) => setPhotoUrl(photos[0] || undefined)}
              maxPhotos={1}
            />

            <div>
              <label className="text-xs font-bold text-slate-700">Observaciones Técnicas</label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Notas adicionales, historial previo, condiciones del cuarto técnico..."
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : compressorToEdit ? 'Actualizar Compresor' : 'Registrar Compresor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
