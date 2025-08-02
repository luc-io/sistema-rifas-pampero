/**
 * 🎨 Generador de Iconos para Sistema de Rifas Pampero
 * Crea iconos en diferentes tamaños basados en el velero
 */

(function() {
    'use strict';
    
    console.log('🎨 [ICONS] Generador de iconos del velero Pampero cargado');
    
    /**
     * SVG del icono principal (basado en la imagen del velero)
     */
    const pamperoSailboatSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#0F1629" stroke="#1E40AF" stroke-width="2"/>
        <line x1="45" y1="15" x2="45" y2="75" stroke="#8B4513" stroke-width="2.5"/>
        <path d="M20 20 L20 45 L45 35 Z" fill="#DC2626" stroke="#B91C1C" stroke-width="1"/>
        <path d="M20 40 L20 55 L45 50 Z" fill="#F59E0B" stroke="#D97706" stroke-width="1"/>
        <path d="M20 50 L20 65 L45 60 Z" fill="#EC4899" stroke="#DB2777" stroke-width="1"/>
        <path d="M45 25 L70 35 L45 45 Z" fill="#FBBF24" stroke="#F59E0B" stroke-width="1"/>
        <path d="M25 70 Q45 80 75 70 L70 75 Q45 82 30 75 Z" fill="#6B7280" stroke="#374151" stroke-width="1.5"/>
        <ellipse cx="50" cy="72" rx="20" ry="3" fill="#8B4513" stroke="#92400E" stroke-width="1"/>
        <path d="M5 80 Q15 75 25 80 Q35 85 45 80 Q55 75 65 80 Q75 85 85 80 Q90 75 95 80" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.7"/>
        <path d="M25 82 Q45 87 75 82" fill="none" stroke="#60A5FA" stroke-width="1" opacity="0.5"/>
        <text x="50" y="95" font-family="Arial" font-size="8" font-weight="bold" text-anchor="middle" fill="#FFFFFF">PAMPERO</text>
    </svg>`;
    
    /**
     * Generar favicon SVG como data URL
     */
    window.generatePamperoFavicon = function() {
        const svgBlob = new Blob([pamperoSailboatSVG], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        console.log('🎨 [ICONS] Favicon del velero Pampero generado');
        return svgUrl;
    };
    
    /**
     * Actualizar favicon dinámicamente
     */
    window.updateFavicon = function() {
        try {
            // Remover favicon anterior
            const existingFavicon = document.querySelector('link[rel="icon"]');
            if (existingFavicon) {
                existingFavicon.remove();
            }
            
            // Crear nuevo favicon con el velero
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/svg+xml';
            favicon.href = `data:image/svg+xml,${encodeURIComponent(pamperoSailboatSVG)}`;
            
            document.head.appendChild(favicon);
            
            console.log('✅ [ICONS] Favicon del velero Pampero aplicado');
            
            if (window.Utils && window.Utils.showNotification) {
                window.Utils.showNotification('Icono del velero Pampero aplicado', 'success');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ [ICONS] Error actualizando favicon:', error);
            return false;
        }
    };
    
    /**
     * Generar iconos PWA en diferentes tamaños
     */
    window.generatePWAIcons = function() {
        const sizes = [16, 32, 48, 72, 96, 144, 192, 512];
        const icons = [];
        
        sizes.forEach(size => {
            const scaledSVG = pamperoSailboatSVG.replace(
                'viewBox="0 0 100 100"', 
                `viewBox="0 0 100 100" width="${size}" height="${size}"`
            );
            
            icons.push({
                size: size,
                svg: scaledSVG,
                dataUrl: `data:image/svg+xml,${encodeURIComponent(scaledSVG)}`
            });
        });
        
        console.log('🎨 [ICONS] Iconos PWA generados para tamaños:', sizes);
        return icons;
    };
    
    /**
     * Descargar icono como archivo SVG
     */
    window.downloadPamperoIcon = function(filename = 'pampero-icon.svg') {
        try {
            const blob = new Blob([pamperoSailboatSVG], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            
            URL.revokeObjectURL(url);
            
            console.log('📥 [ICONS] Icono descargado:', filename);
            alert(`✅ Icono descargado como ${filename}`);
            
        } catch (error) {
            console.error('❌ [ICONS] Error descargando icono:', error);
            alert(`Error descargando icono: ${error.message}`);
        }
    };
    
    /**
     * Previsualizar icono en diferentes tamaños
     */
    window.previewPamperoIcon = function() {
        const sizes = [16, 32, 48, 96];
        let preview = '🎨 Vista previa del icono del velero Pampero:\n\n';
        
        sizes.forEach(size => {
            preview += `📏 ${size}x${size}px: Velero con velas coloridas\n`;
        });
        
        preview += '\n🎨 Colores incluidos:\n';
        preview += '🔴 Rojo: Vela superior\n';
        preview += '🟡 Amarillo/Dorado: Vela media y proa\n';
        preview += '🌸 Rosa/Fucsia: Vela inferior\n';
        preview += '🔵 Azul marino: Fondo (mar)\n';
        preview += '🤎 Marrón: Mástil y cubierta\n';
        preview += '⚪ Gris: Casco del barco\n';
        
        alert(preview);
    };
    
    /**
     * Aplicar icono automáticamente al cargar
     */
    setTimeout(() => {
        updateFavicon();
    }, 1000);
    
    console.log('🏁 [ICONS] Sistema de iconos del velero Pampero listo');
    console.log('📋 [ICONS] Comandos disponibles:');
    console.log('  updateFavicon() - Aplicar icono del velero');
    console.log('  downloadPamperoIcon() - Descargar icono SVG');
    console.log('  generatePWAIcons() - Generar iconos PWA');
    console.log('  previewPamperoIcon() - Vista previa del icono');
})();
