<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PBR Explorer

A lightweight, high-performance PBR (Physically Based Rendering) material visualizer built entirely with vanilla **HTML**, **CSS**, and **JavaScript**.

## 🚀 Features

- **Zero Dependencies**: No `npm`, `node_modules`, or build steps. Purely self-contained.
- **Real-time 3D Rendering**: Powered by Three.js (via CDN) with ACES Filmic tone mapping.
- **Drag-and-Drop Workflow**: Instantly visualize texture sets by dragging them into the viewport.
- **Interactive Parameters**: Fine-tune your materials with both sliders and precise numeric input boxes.
- **Multiple Geometries**: Switch between Cube, Sphere, and Plane views.
- **Premium UI**: Modern dark-mode interface with glassmorphism and custom scrollbars.

## 🛠️ Supported Texture Maps

The explorer automatically matches files based on naming conventions:
- **Albedo / Map**: `albedo`, `diffuse`, `basecolor`, `color`
- **Normal**: `normal`, `nrm`, `nm`
- **Roughness**: `roughness`, `rough`, `rgh`
- **Metallic**: `metal`, `mtl`
- **AO**: `ao`, `ambientocclusion`
- **Height / Displacement**: `height`, `displacement`, `disp`

## 🏁 How to Run

1. Clone or download this repository.
2. Open [index.html](index.html) in any modern web browser.
3. Drag and drop your texture maps into the 3D window to apply them.
