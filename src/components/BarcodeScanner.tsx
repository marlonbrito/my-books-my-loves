import { useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inicia leitor na primeira vez
  if (!codeReaderRef.current) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ]);
    codeReaderRef.current = new BrowserMultiFormatReader(hints);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setError(null);
    setIsProcessing(true);

    try {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);

      // Cria uma imagem para passar pro ZXing
      const img = new Image();
      img.src = imageUrl;

      img.onload = async () => {
        try {
          const result = await codeReaderRef.current!.decodeFromImage(img);
          onScan(result.getText());
          setIsProcessing(false);
          URL.revokeObjectURL(imageUrl); // limpa URL temporária
        } catch (err) {
          if (err instanceof NotFoundException) {
            setError("Código de barras não encontrado na imagem.");
          } else {
            setError("Erro ao ler o código de barras.");
            console.error(err);
          }
          setIsProcessing(false);
          URL.revokeObjectURL(imageUrl);
        }
      };

      img.onerror = () => {
        setError("Não foi possível carregar a imagem.");
        setIsProcessing(false);
        URL.revokeObjectURL(imageUrl);
      };
    } catch (err) {
      setError("Erro ao processar a imagem.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📷 Scanner de Código de Barras</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div className="mb-4">
          <input
            ref={inputFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>

        {isProcessing && (
          <div className="text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Processando imagem...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
