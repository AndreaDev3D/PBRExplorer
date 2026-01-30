
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Circle, Square, Upload, Layers, Settings2, Trash2, Info } from 'lucide-react';
import MaterialViewer from './components/MaterialViewer';
import { MaterialState, TextureMapType, ShapeType, ViewerSettings } from './types';

const App: React.FC = () => {
  const [material, setMaterial] = useState<MaterialState>({
    map: null,
    normalMap: null,
    roughnessMap: null,
    metalnessMap: null,
    aoMap: null,
    displacementMap: null,
  });

  const [settings, setSettings] = useState<ViewerSettings>({
    shape: 'cube',
    tiling: 1,
    displacementScale: 0.05,
    exposure: 1,
    roughness: 1,
    metalness: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const matchTextureType = (filename: string): TextureMapType | null => {
    const f = filename.toLowerCase();
    if (f.includes('albedo') || f.includes('diffuse') || f.includes('basecolor') || f.includes('color')) return 'map';
    if (f.includes('normal') || f.includes('nrm') || f.includes('nm')) return 'normalMap';
    if (f.includes('roughness') || f.includes('rough') || f.includes('rgh')) return 'roughnessMap';
    if (f.includes('metal') || f.includes('mtl')) return 'metalnessMap';
    if (f.includes('ao') || f.includes('ambientocclusion') || f.includes('occlusion')) return 'aoMap';
    if (f.includes('height') || f.includes('displacement') || f.includes('disp')) return 'displacementMap';
    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newMaterial = { ...material };
    
    Array.from(files).forEach(file => {
      const type = matchTextureType(file.name);
      if (type) {
        // Revoke old URL if exists
        if (newMaterial[type]) {
          URL.revokeObjectURL(newMaterial[type]!.url);
        }
        newMaterial[type] = {
          url: URL.createObjectURL(file),
          name: file.name
        };
      }
    });

    setMaterial(newMaterial);
  }, [material]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const resetTexture = (type: TextureMapType) => {
    if (material[type]) {
      URL.revokeObjectURL(material[type]!.url);
      setMaterial(prev => ({ ...prev, [type]: null }));
    }
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col md:flex-row bg-zinc-950 overflow-hidden relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <Upload className="w-16 h-16 text-blue-400 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Drop textures here</h2>
            <p className="text-zinc-400 mt-2">Albedo, Normal, Roughness, Metallic, AO, Height</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-full md:w-80 h-1/3 md:h-full bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto z-40 p-6 scrollbar-thin scrollbar-thumb-zinc-700">
        <header className="mb-8">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-blue-500" />
            PBR Explorer
          </h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">Material Visualization</p>
        </header>

        {/* Shape Selector */}
        <section className="mb-8">
          <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2">
            <Settings2 size={14} /> GEOMETRY
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['cube', 'sphere', 'plane'] as ShapeType[]).map((shape) => (
              <button
                key={shape}
                onClick={() => setSettings(s => ({ ...s, shape }))}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  settings.shape === shape 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750 hover:border-zinc-600'
                }`}
              >
                {shape === 'cube' && <Box size={24} />}
                {shape === 'sphere' && <Circle size={24} />}
                {shape === 'plane' && <Square size={24} />}
                <span className="text-[10px] mt-2 font-bold uppercase">{shape}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Textures Slots */}
        <section className="mb-8">
          <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2">
            <Layers size={14} /> TEXTURE SLOTS
          </h3>
          <div className="space-y-3">
            {[
              { id: 'map', label: 'Albedo / Map' },
              { id: 'normalMap', label: 'Normal' },
              { id: 'roughnessMap', label: 'Roughness' },
              { id: 'metalnessMap', label: 'Metallic' },
              { id: 'aoMap', label: 'AO' },
              { id: 'displacementMap', label: 'Height' },
            ].map((slot) => (
              <div key={slot.id} className="group relative">
                <div className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                  material[slot.id as TextureMapType] 
                    ? 'bg-zinc-800 border-emerald-500/50' 
                    : 'bg-zinc-900 border-zinc-800 border-dashed'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{slot.label}</span>
                    <span className="text-xs truncate max-w-[140px] text-zinc-300">
                      {material[slot.id as TextureMapType]?.name || 'Not loaded'}
                    </span>
                  </div>
                  {material[slot.id as TextureMapType] ? (
                    <button 
                      onClick={() => resetTexture(slot.id as TextureMapType)}
                      className="text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded border border-zinc-800 flex items-center justify-center text-zinc-700">
                      <Upload size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Parameters */}
        <section className="mb-8">
          <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2">
            <Settings2 size={14} /> PARAMETERS
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-zinc-400">TILING</label>
                <span className="text-[10px] font-bold text-blue-400">{settings.tiling}x</span>
              </div>
              <input 
                type="range" min="0.1" max="10" step="0.1" value={settings.tiling}
                onChange={(e) => setSettings(s => ({ ...s, tiling: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-zinc-400">DISPLACEMENT</label>
                <span className="text-[10px] font-bold text-blue-400">{settings.displacementScale}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" value={settings.displacementScale}
                onChange={(e) => setSettings(s => ({ ...s, displacementScale: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-zinc-400">EXPOSURE</label>
                <span className="text-[10px] font-bold text-blue-400">{settings.exposure}</span>
              </div>
              <input 
                type="range" min="0" max="2" step="0.1" value={settings.exposure}
                onChange={(e) => setSettings(s => ({ ...s, exposure: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </section>

        <footer className="mt-auto pt-6 border-t border-zinc-800 flex items-center gap-3 text-zinc-600">
          <Info size={16} />
          <p className="text-[10px] leading-tight">Drag and drop texture sets directly onto the 3D viewport to apply them.</p>
        </footer>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 h-2/3 md:h-full relative">
        <MaterialViewer material={material} settings={settings} />
        
        {/* Viewport UI Overlays */}
        <div className="absolute top-6 left-6 pointer-events-none">
          <div className="bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 inline-flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold tracking-widest text-zinc-300">REALTIME RENDERER</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
