// Client-side file → base64 upload prep, shared by DischargeFlow (discharge
// summaries) and WalletTab (receipts). Images are downscaled to 1600px JPEG:
// cheaper to send, faster to parse, still perfectly legible for documents.

export type Upload = {
  base64: string;
  mediaType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  name: string;
};

const MAX_IMAGE_DIM = 1600;

export async function fileToUpload(file: File): Promise<Upload> {
  if (file.type === 'application/pdf') {
    const buf = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    }
    return { base64: btoa(binary), mediaType: 'application/pdf', name: file.name };
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const jpeg = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: jpeg.split(',')[1], mediaType: 'image/jpeg', name: file.name };
}
