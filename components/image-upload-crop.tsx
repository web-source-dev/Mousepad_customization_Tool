import React, { useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
// You need to install react-easy-crop and browser-image-compression
// npm install react-easy-crop browser-image-compression
import imageCompression from 'browser-image-compression';

interface ImageUploadCropProps {
  aspectRatio: number;
  customerName: string;
  orderNumber: string;
  productSize: string;
  mousepadType: string;
  onCropComplete: (croppedImage: File, previewUrl: string, dpi: number, fileName: string) => void;
}

const MAX_FILE_SIZE_MB = 100;
const MIN_DPI = 150;

function getFileName(customerName: string, orderNumber: string, productSize: string, mousepadType: string, ext: string) {
  return `${customerName}_${orderNumber}_${productSize}_${mousepadType}.${ext}`;
}

function calculateDPI(width: number, height: number, physicalWidthMM: number, physicalHeightMM: number) {
  // Convert mm to inches
  const widthInches = physicalWidthMM / 25.4;
  const heightInches = physicalHeightMM / 25.4;
  return Math.min(width / widthInches, height / heightInches);
}

const ImageUploadCrop: React.FC<ImageUploadCropProps> = ({
  aspectRatio,
  customerName,
  orderNumber,
  productSize,
  mousepadType,
  onCropComplete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dpiWarning, setDpiWarning] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError('File is too large. Max 100MB allowed.');
      return;
    }
    setError(null);
    // Compress/resize if needed
    let compressedFile = file;
    if (file.size > 10 * 1024 * 1024) {
      compressedFile = await imageCompression(file, { maxSizeMB: 10, maxWidthOrHeight: 8000 });
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(compressedFile);
  };

  const onCropCompleteHandler = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showDpiWarning = (dpi: number) => {
    if (dpi < MIN_DPI) {
      setDpiWarning(`Warning: Image DPI is below 150 (${Math.round(dpi)} DPI). Print quality may be low, but you can proceed.`);
    } else {
      setDpiWarning(null);
    }
  };

  const getPhysicalSize = () => {
    // Example: productSize = '400x900x4mm_RGB' => 400, 900
    const match = productSize.match(/(\d+)x(\d+)/);
    if (match) {
      return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }
    return { width: 400, height: 900 };
  };

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );
    // Calculate DPI
    const { width: mmWidth, height: mmHeight } = getPhysicalSize();
    const dpi = calculateDPI(canvas.width, canvas.height, mmWidth, mmHeight);
    showDpiWarning(dpi);
    // Output as high-quality JPG or PNG
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const ext = blob.type === 'image/png' ? 'png' : 'jpg';
        const fileName = getFileName(customerName, orderNumber, productSize, mousepadType, ext);
        const file = new File([blob], fileName, { type: blob.type });
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(file, previewUrl, dpi, fileName);
        setProcessing(false);
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        style={{ display: 'block', marginBottom: 16 }}
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {imageSrc && (
        <div style={{ position: 'relative', width: '100%', height: 400, background: '#222' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
            cropShape="rect"
            showGrid={true}
            restrictPosition={true}
          />
        </div>
      )}
      {imageSrc && (
        <div style={{ marginTop: 16 }}>
          <label>Zoom:</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: 200 }}
          />
        </div>
      )}
      {dpiWarning && <div style={{ color: 'orange', marginTop: 8 }}>{dpiWarning}</div>}
      {imageSrc && (
        <button onClick={handleCrop} disabled={processing} style={{ marginTop: 16 }}>
          {processing ? 'Processing...' : 'Crop & Save'}
        </button>
      )}
    </div>
  );
};

export default ImageUploadCrop; 