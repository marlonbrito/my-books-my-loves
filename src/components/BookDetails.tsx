import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { BookForm } from "./BookForm";
import { Id } from "../../convex/_generated/dataModel";

interface BookDetailsProps {
  bookId: string;
  onBack: () => void;
}

export function BookDetails({ bookId, onBack }: BookDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBackCover, setShowBackCover] = useState(false);
  
  const book = useQuery(api.books.getBook, { bookId: bookId as Id<"books"> });
  const deleteBook = useMutation(api.books.deleteBook);
  const toggleReadStatus = useMutation(api.books.toggleReadStatus);
  const toggleLoanStatus = useMutation(api.books.toggleLoanStatus);

  if (book === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Livro não encontrado</h2>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Voltar à Biblioteca
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <BookForm
        editingBook={book}
        onSuccess={() => {
          setIsEditing(false);
          toast.success("Livro atualizado com sucesso!");
        }}
      />
    );
  }

  const handleDelete = async () => {
    try {
      await deleteBook({ bookId: book._id });
      toast.success("Livro removido da biblioteca");
      onBack();
    } catch (error) {
      toast.error("Erro ao remover livro");
    }
  };

  const handleToggleRead = async () => {
    try {
      await toggleReadStatus({ bookId: book._id });
      toast.success(book.isRead ? "Marcado como não lido" : "Marcado como lido");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleToggleLoan = async () => {
    if (book.isLoaned) {
      try {
        await toggleLoanStatus({ bookId: book._id });
        toast.success("Livro devolvido");
      } catch (error) {
        toast.error("Erro ao atualizar empréstimo");
      }
    } else {
      const loanedTo = prompt("Para quem você está emprestando este livro?");
      if (loanedTo?.trim()) {
        try {
          await toggleLoanStatus({ bookId: book._id, loanedTo: loanedTo.trim() });
          toast.success("Livro marcado como emprestado");
        } catch (error) {
          toast.error("Erro ao atualizar empréstimo");
        }
      }
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xl ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ♥
      </span>
    ));
  };

  const formatLoanDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
        >
          ← Voltar à Biblioteca
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            🗑️ Remover
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-8 p-8">
          {/* Book Cover Section */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-lg">
                {(showBackCover && book.backCoverUrl) ? (
                  <img
                    src={book.backCoverUrl}
                    alt={`Verso de ${book.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">📖</div>
                      <div className="text-lg font-medium text-gray-700 leading-tight">
                        {book.title}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Cover Toggle Button */}
                {book.backCoverUrl && (
                  <button
                    onClick={() => setShowBackCover(!showBackCover)}
                    className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs hover:bg-black/80 transition-colors"
                  >
                    {showBackCover ? "Frente" : "Verso"}
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleToggleRead}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    book.isRead
                      ? "bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300"
                  }`}
                >
                  {book.isRead ? "✓ Lido" : "📖 Marcar como Lido"}
                </button>
                
                <button
                  onClick={handleToggleLoan}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    book.isLoaned
                      ? "bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-300"
                  }`}
                >
                  {book.isLoaned ? "🔄 Devolver" : "🤝 Emprestar"}
                </button>
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Author */}
            <div className="border-b border-gray-200 pb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-3 leading-tight">
                {book.title}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                por <span className="font-semibold">{book.author}</span>
              </p>
              
              {/* Rating and Genre */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(book.rating)}
                  </div>
                  <span className="text-gray-600 font-medium">({book.rating}/5)</span>
                </div>
                <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                  {book.genre}
                </span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-3">
                {book.isRead && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                    ✓ Lido
                  </span>
                )}
                {book.isLoaned && (
                  <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium border border-red-200">
                    🤝 Emprestado para {book.loanedTo}
                    {book.loanDate && (
                      <span className="block text-xs mt-1">
                        desde {formatLoanDate(book.loanDate)}
                      </span>
                    )}
                  </span>
                )}
                {book.isPartOfSeries && (
                  <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium border border-purple-200">
                    📚 Série: {book.seriesName}
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {book.summary && (
              <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  📝 Resumo
                </h3>
                <p className="text-gray-700 leading-relaxed text-justify">
                  {book.summary}
                </p>
              </div>
            )}

            {/* Book Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Informações Técnicas
                </h3>
                <div className="space-y-3 text-sm">
                  {book.isbn && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">ISBN:</span>
                      <span className="font-mono text-gray-800">{book.isbn}</span>
                    </div>
                  )}
                  {book.publishedYear && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Ano de Publicação:</span>
                      <span className="font-semibold text-gray-800">{book.publishedYear}</span>
                    </div>
                  )}
                  {book.publisher && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Editora:</span>
                      <span className="font-semibold text-gray-800">{book.publisher}</span>
                    </div>
                  )}
                  {book.pageCount && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Páginas:</span>
                      <span className="font-semibold text-gray-800">{book.pageCount}</span>
                    </div>
                  )}
                  {book.language && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Idioma:</span>
                      <span className="font-semibold text-gray-800">{book.language}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📈 Status da Leitura
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      book.isRead 
                        ? "bg-green-100 text-green-700" 
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {book.isRead ? "✓ Concluído" : "📖 Para Ler"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avaliação:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(book.rating)}
                    </div>
                  </div>

                  {book.isLoaned && (
                    <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                      <div className="text-sm">
                        <div className="font-medium text-red-800">Emprestado para:</div>
                        <div className="text-red-700">{book.loanedTo}</div>
                        {book.loanDate && (
                          <div className="text-xs text-red-600 mt-1">
                            Desde {formatLoanDate(book.loanDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmar Remoção
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja remover "{book.title}" da sua biblioteca? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Sim, Remover
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
