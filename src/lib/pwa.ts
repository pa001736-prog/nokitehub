export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function createCompositeIcon(shopLogoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('/logoo.png');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    const shopImg = new Image();
    shopImg.crossOrigin = 'anonymous';
    
    shopImg.onload = () => {
      // Contain logic
      const scale = Math.min(512 / shopImg.width, 512 / shopImg.height);
      const w = shopImg.width * scale;
      const h = shopImg.height * scale;
      const x = (512 - w) / 2;
      const y = (512 - h) / 2;
      
      ctx.drawImage(shopImg, x, y, w, h);

      // Draw watermark
      const watermark = new Image();
      watermark.crossOrigin = 'anonymous';
      watermark.onload = () => {
        const wmSize = 120;
        const padding = 24;
        
        // Draw watermark circle background with shadow
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        
        ctx.beginPath();
        ctx.arc(512 - wmSize/2 - padding, 512 - wmSize/2 - padding, wmSize/2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.shadowColor = 'transparent'; // reset shadow
        
        // Draw watermark image
        ctx.drawImage(
          watermark, 
          512 - wmSize - padding, 
          512 - wmSize - padding, 
          wmSize, 
          wmSize
        );
        
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          console.warn('Canvas taint error, falling back to default logo', e);
          resolve('/logoo.png');
        }
      };
      watermark.onerror = () => {
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve('/logoo.png');
        }
      };
      watermark.src = '/logoo.png';
    };
    shopImg.onerror = () => resolve('/logoo.png');
    shopImg.src = shopLogoUrl || '/logoo.png';
  });
}

export async function updateDynamicManifest(shopName: string, shopLogoUrl?: string) {
  try {
    const iconDataUrl = await createCompositeIcon(shopLogoUrl || '/logoo.png');
    
    const manifest = {
      name: shopName || 'Nokite Hub',
      short_name: shopName ? shopName.substring(0, 12) : 'Nokite',
      description: `Aplicativo da barbearia ${shopName}`,
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: iconDataUrl,
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: iconDataUrl,
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    const stringManifest = JSON.stringify(manifest);
    const base64Manifest = btoa(unescape(encodeURIComponent(stringManifest)));
    const manifestUrl = `data:application/json;base64,${base64Manifest}`;

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;
  } catch (e) {
    console.error('Failed to update dynamic manifest', e);
  }
}
