import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface LoanedBooksProps {
  onViewBook: (bookId: Id<"books">) => void;
}

interface LoanedBook {
  _id: Id<"books">;
  title: string;
  author: string;
  loanedTo?: string;
  loanDate?: number;
  coverUrl: string | null;
  genre: string;
}

export function LoanedBooks({ onViewBook }: LoanedBooksProps) {
  const loanedBooks = useQuery(api.books.getLoanedBooks);
  const toggleLoanStatus = useMutation(api.books.toggleLoanStatus);

  const handleReturnBook = async (bookId: Id<"books">, title: string) => {
    try {
      await toggleLoanStatus({ bookId });
      toast.success(`"${title}" foi devolvido`);
    } catch (error) {
      toast.error("Erro ao devolver livro");
    }
  };

  const formatLoanDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "há 1 dia";
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana(s)`;
    return `há ${Math.floor(diffDays / 30)} mês(es)`;
  };

  if (loanedBooks === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Livros Emprestados</h2>
        <p className="text-gray-600">
          {loanedBooks.length} {loanedBooks.length === 1 ? "livro emprestado" : "livros emprestados"}
        </p>
      </div>

      {loanedBooks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum livro emprestado
          </h3>
          <p className="text-gray-500">
            Todos os seus livros estão em casa!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loanedBooks.map((book) => (
            <div
              key={book._id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {/* Book Cover */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-28 relative overflow-hidden bg-gray-100 rounded-lg">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <div className="text-center">
                          <div className="text-lg mb-1">📖</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 mb-2">por {book.author}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {book.genre}
                        </span>
                        <span>Emprestado {book.loanDate ? formatLoanDate(book.loanDate) : "data não informada"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Info */}
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          🤝 Emprestado para: <span className="font-bold">{book.loanedTo || "Não informado"}</span>
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Desde {book.loanDate ? new Date(book.loanDate).toLocaleDateString('pt-BR') : "Data não informada"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewBook(book._id)}
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => handleReturnBook(book._id, book.title)}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Marcar como Devolvido
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {loanedBooks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo dos Empréstimos</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{loanedBooks.length}</div>
              <div className="text-sm text-red-700">Livros Emprestados</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {loanedBooks.filter(book => {
                  if (!book.loanDate) return false;
                  const daysSince = Math.ceil((Date.now() - book.loanDate) / (1000 * 60 * 60 * 24));
                  return daysSince > 30;
                }).length}
              </div>
              <div className="text-sm text-orange-700">Há mais de 30 dias</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(loanedBooks.map(book => book.loanedTo).filter(Boolean)).size}
              </div>
              <div className="text-sm text-blue-700">Pessoas Diferentes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
