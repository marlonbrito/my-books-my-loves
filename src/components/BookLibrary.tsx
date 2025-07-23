import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BookCard } from "./BookCard";
import { SearchBar } from "./SearchBar";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface BookLibraryProps {
  onViewBook: (bookId: Id<"books">) => void;
}

export function BookLibrary({ onViewBook }: BookLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const books = useQuery(api.books.listBooks);
  const searchResults = useQuery(
    api.books.searchBooks,
    searchTerm.trim() ? { searchTerm } : "skip"
  );

  const displayBooks = searchTerm.trim() ? searchResults : books;

  if (books === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Minha Biblioteca</h2>
        <p className="text-gray-600 mb-6">
          {books.length} {books.length === 1 ? "livro" : "livros"} na sua coleção
        </p>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      {displayBooks && displayBooks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm.trim() ? "Nenhum livro encontrado" : "Sua biblioteca está vazia"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm.trim() 
              ? "Tente buscar por outro termo"
              : "Comece adicionando seu primeiro livro à coleção"
            }
          </p>
          {!searchTerm.trim() && (
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Adicionar Primeiro Livro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {displayBooks?.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onClick={() => onViewBook(book._id)}
            />
          ))}
        </div>
      )}

      {/* Statistics */}
      {books.length > 0 && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {books.length}
            </div>
            <div className="text-sm text-gray-600">Total de Livros</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {books.filter(book => book.isRead).length}
            </div>
            <div className="text-sm text-gray-600">Lidos</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {books.filter(book => !book.isRead).length}
            </div>
            <div className="text-sm text-gray-600">Para Ler</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-red-600">
              {books.filter(book => book.isLoaned).length}
            </div>
            <div className="text-sm text-gray-600">Emprestados</div>
          </div>
        </div>
      )}
    </div>
  );
}
