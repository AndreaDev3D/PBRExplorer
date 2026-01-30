
export type TextureMapType = 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap' | 'displacementMap';

export interface TextureData {
  url: string;
  name: string;
}

export interface MaterialState {
  map: TextureData | null;
  normalMap: TextureData | null;
  roughnessMap: TextureData | null;
  metalnessMap: TextureData | null;
  aoMap: TextureData | null;
  displacementMap: TextureData | null;
}

export type ShapeType = 'cube' | 'sphere' | 'plane';

export interface ViewerSettings {
  shape: ShapeType;
  tiling: number;
  displacementScale: number;
  exposure: number;
  roughness: number;
  metalness: number;
}
