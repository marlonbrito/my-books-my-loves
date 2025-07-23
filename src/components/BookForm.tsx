import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { BarcodeScanner } from "./BarcodeScanner";
import RatingSelector from "@/components/RatingSelector";

interface BookFormProps {
  onSuccess: () => void;
  editingBook?: any;
}

export function BookForm({ onSuccess, editingBook }: BookFormProps) {
  const [formData, setFormData] = useState({
    title: editingBook?.title || "",
    author: editingBook?.author || "",
    genre: editingBook?.genre || "",
    rating: editingBook?.rating || 5,
    isRead: editingBook?.isRead || false,
    isPartOfSeries: editingBook?.isPartOfSeries || false,
    seriesName: editingBook?.seriesName || "",
    isLoaned: editingBook?.isLoaned || false,
    loanedTo: editingBook?.loanedTo || "",
    summary: editingBook?.summary || "",
    isbn: editingBook?.isbn || "",
    publishedYear: editingBook?.publishedYear || "",
    publisher: editingBook?.publisher || "",
    pageCount: editingBook?.pageCount || "",
    language: editingBook?.language || "Português",
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [backCoverImage, setBackCoverImage] = useState<File | null>(null);
  const [downloadedCoverImageId, setDownloadedCoverImageId] = useState<Id<"_storage"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const backCoverInputRef = useRef<HTMLInputElement>(null);

  const createBook = useMutation(api.books.createBook);
  const updateBook = useMutation(api.books.updateBook);
  const generateUploadUrl = useMutation(api.books.generateUploadUrl);
  const searchByISBN = useAction(api.bookApi.searchBookByISBN);
  const searchByTitle = useAction(api.bookApi.searchBookByTitle);
  const searchByBarcode = useAction(api.bookApi.searchBookByBarcode);
  const downloadAndSaveCoverImage = useAction(api.bookApi.downloadAndSaveCoverImage);

  const genres = [
    "Ficção", "Romance", "Mistério", "Fantasia", "Ficção Científica",
    "Biografia", "História", "Autoajuda", "Negócios", "Técnico",
    "Infantil", "Jovem Adulto", "Clássico", "Poesia", "Drama",
    "Aventura", "Terror", "Suspense", "Comédia", "Outro"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = async (file: File): Promise<Id<"_storage"> | null> => {
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }
  };

  const handleBookDataFound = async (bookData: any, source: string) => {
    setFormData(prev => ({
      ...prev,
      title: bookData.title || prev.title,
      author: bookData.author || prev.author,
      summary: bookData.summary || prev.summary,
      genre: bookData.genre || prev.genre,
      isbn: bookData.isbn || prev.isbn,
      publishedYear: bookData.publishedYear?.toString() || prev.publishedYear,
      publisher: bookData.publisher || prev.publisher,
      pageCount: bookData.pageCount?.toString() || prev.pageCount,
      language: bookData.language || prev.language,
    }));

    // Download and save cover image if available
    if (bookData.coverImageUrl) {
      setCoverPreviewUrl(bookData.coverImageUrl);
      toast.success(`Dados do livro encontrados via ${source}! Baixando capa...`);
      
      try {
        const coverImageId = await downloadAndSaveCoverImage({ 
          imageUrl: bookData.coverImageUrl 
        });
        
        if (coverImageId) {
          setDownloadedCoverImageId(coverImageId);
          toast.success("Capa baixada automaticamente!");
        } else {
          toast.warning("Dados encontrados, mas não foi possível baixar a capa");
        }
      } catch (error) {
        console.error("Error downloading cover:", error);
        toast.warning("Dados encontrados, mas não foi possível baixar a capa");
      }
    } else {
      toast.success(`Dados do livro encontrados via ${source}!`);
    }
  };

  const handleSearchByISBN = async () => {
    if (!formData.isbn.trim()) {
      toast.error("Digite um ISBN para buscar");
      return;
    }

    setIsSearching(true);
    try {
      const bookData = await searchByISBN({ isbn: formData.isbn.trim() });
      if (bookData) {
        await handleBookDataFound(bookData, "ISBN");
      } else {
        toast.error("Livro não encontrado com este ISBN");
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do livro");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByTitle = async () => {
    if (!formData.title.trim()) {
      toast.error("Digite um título para buscar");
      return;
    }

    setIsSearching(true);
    try {
      const bookData = await searchByTitle({ 
        title: formData.title.trim(),
        author: formData.author.trim() || undefined
      });
      if (bookData) {
        await handleBookDataFound(bookData, "título");
      } else {
        toast.error("Livro não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do livro");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    
    // Update ISBN field with scanned barcode
    setFormData(prev => ({ ...prev, isbn: barcode }));
    
    setIsSearching(true);
    try {
      const bookData = await searchByBarcode({ barcode });
      if (bookData) {
        await handleBookDataFound(bookData, "código de barras");
      } else {
        toast.error("Livro não encontrado com este código de barras");
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do livro pelo código de barras");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error("Título e autor são obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      let coverImageId: Id<"_storage"> | undefined;
      let backCoverImageId: Id<"_storage"> | undefined;

      // Use downloaded cover image if available, otherwise upload manual selection
      if (downloadedCoverImageId) {
        coverImageId = downloadedCoverImageId;
      } else if (coverImage) {
        coverImageId = await handleImageUpload(coverImage) || undefined;
      }

      if (backCoverImage) {
        backCoverImageId = await handleImageUpload(backCoverImage) || undefined;
      }

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        genre: formData.genre,
        rating: formData.rating,
        isRead: formData.isRead,
        isPartOfSeries: formData.isPartOfSeries,
        seriesName: formData.isPartOfSeries ? formData.seriesName.trim() : undefined,
        isLoaned: formData.isLoaned,
        loanedTo: formData.isLoaned ? formData.loanedTo.trim() : undefined,
        summary: formData.summary.trim() || undefined,
        isbn: formData.isbn.trim() || undefined,
        coverImageId,
        backCoverImageId,
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
        publisher: formData.publisher.trim() || undefined,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : undefined,
        language: formData.language.trim() || undefined,
      };

      if (editingBook) {
        await updateBook({ bookId: editingBook._id, ...bookData });
        toast.success("Livro atualizado com sucesso!");
      } else {
        await createBook(bookData);
        toast.success("Livro adicionado com sucesso!");
      }
      
      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar livro");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editingBook ? "Editar Livro" : "Adicionar Novo Livro"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🔍 Busca Automática com Download de Capa</h3>
            
            {/* Barcode Scanner Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowBarcodeScanner(true)}
                disabled={isSearching}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                📱 Escanear Código de Barras
              </button>
              <p className="text-xs text-gray-600 mt-1">
                Use a câmera para escanear o código de barras do livro
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISBN / Código de Barras
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    placeholder="Digite o ISBN ou código de barras..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearchByISBN}
                    disabled={isSearching || !formData.isbn.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? "..." : "🔍"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por Título
                </label>
                <button
                  type="button"
                  onClick={handleSearchByTitle}
                  disabled={isSearching || !formData.title.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? "Buscando..." : "Buscar Dados + Capa"}
                </button>
              </div>
            </div>
            
            {/* Cover Preview */}
            {(coverPreviewUrl || downloadedCoverImageId) && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden">
                    {coverPreviewUrl && (
                      <img 
                        src={coverPreviewUrl} 
                        alt="Preview da capa" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      ✅ Capa encontrada e {downloadedCoverImageId ? 'salva automaticamente' : 'pronta para download'}
                    </p>
                    <p className="text-xs text-green-600">
                      A capa será usada automaticamente ao salvar o livro
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autor *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gênero
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione um gênero</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
        <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Avaliação (1-5 Corações)
  </label>
  <RatingSelector
    value={formData.rating}
    onChange={(val) =>
      setFormData((prev) => ({ ...prev, rating: val }))
    }
  />
</div>

          </div>

          {/* Cover Images */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capa do Livro {downloadedCoverImageId && <span className="text-green-600">(✅ Baixada automaticamente)</span>}
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {downloadedCoverImageId && (
                <p className="text-xs text-gray-600 mt-1">
                  Você pode substituir a capa automática selecionando uma nova imagem acima
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verso do Livro (opcional)
              </label>
              <input
                ref={backCoverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setBackCoverImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano de Publicação
              </label>
              <input
                type="number"
                name="publishedYear"
                value={formData.publishedYear}
                onChange={handleInputChange}
                min="1000"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Editora
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Páginas
              </label>
              <input
                type="number"
                name="pageCount"
                value={formData.pageCount}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resumo/Sinopse
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Digite um resumo ou sinopse do livro..."
            />
          </div>

          {/* Status Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isRead"
                checked={formData.isRead}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Já li este livro
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPartOfSeries"
                checked={formData.isPartOfSeries}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Faz parte de uma série
              </label>
            </div>

            {formData.isPartOfSeries && (
              <div className="ml-6">
                <input
                  type="text"
                  name="seriesName"
                  value={formData.seriesName}
                  onChange={handleInputChange}
                  placeholder="Nome da série..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isLoaned"
                checked={formData.isLoaned}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Livro está emprestado
              </label>
            </div>

            {formData.isLoaned && (
              <div className="ml-6">
                <input
                  type="text"
                  name="loanedTo"
                  value={formData.loanedTo}
                  onChange={handleInputChange}
                  placeholder="Para quem está emprestado..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Salvando..." : editingBook ? "Atualizar Livro" : "Adicionar Livro"}
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
}
