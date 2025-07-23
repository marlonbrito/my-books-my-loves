import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BookLibrary } from "./components/BookLibrary";
import { useState } from "react";
import { BookForm } from "./components/BookForm";
import { BookDetails } from "./components/BookDetails";
import { LoanedBooks } from "./components/LoanedBooks";
import { Id } from "../convex/_generated/dataModel";

type View = "library" | "add-book" | "book-details" | "loaned-books";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("library");
  const [selectedBookId, setSelectedBookId] = useState<Id<"books"> | null>(null);

  const handleViewBook = (bookId: Id<"books">) => {
    setSelectedBookId(bookId);
    setCurrentView("book-details");
  };

  const handleBackToLibrary = () => {
    setCurrentView("library");
    setSelectedBookId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
            onClick={() => setCurrentView("library")}
              src="/logo.png"
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-xl font-bold text-gray-800" onClick={() => setCurrentView("library")}>Minha Biblioteca</h1>
          </div>
          <Authenticated>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex gap-4">
                <button
                  onClick={() => setCurrentView("library")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${currentView === "library"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Biblioteca
                </button>
                <button
                  onClick={() => setCurrentView("add-book")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${currentView === "add-book"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Adicionar Livro
                </button>
                <button
                  onClick={() => setCurrentView("loaned-books")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${currentView === "loaned-books"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Emprestados
                </button>
              </nav>
              <SignOutButton />
            </div>
          </Authenticated>
        </div>
      </header>

      <main className="flex-1">
        <Authenticated>
          <Content
            currentView={currentView}
            selectedBookId={selectedBookId}
            onViewBook={handleViewBook}
            onBackToLibrary={handleBackToLibrary}
            onNavigate={setCurrentView}
          />
        </Authenticated>
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                {/* <div className="text-6xl mb-4">📚</div> */}
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-40 md:w-52 mx-auto mb-6 object-contain"
                  
                />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Bem-vindo à sua Biblioteca Pessoal
                </h2>
                <p className="text-gray-600">
                  Organize, gerencie e acompanhe seus livros de forma inteligente
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>

      {/* Mobile Navigation */}
      <Authenticated>
        <nav className="md:hidden bg-white border-t shadow-lg">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setCurrentView("library")}
              className={`flex flex-col items-center py-2 px-4 rounded-lg ${currentView === "library" ? "text-blue-600" : "text-gray-600"
                }`}
            >
              <span className="text-xl mb-1">📚</span>
              <span className="text-xs">Biblioteca</span>
            </button>
            <button
              onClick={() => setCurrentView("add-book")}
              className={`flex flex-col items-center py-2 px-4 rounded-lg ${currentView === "add-book" ? "text-blue-600" : "text-gray-600"
                }`}
            >
              <span className="text-xl mb-1">➕</span>
              <span className="text-xs">Adicionar</span>
            </button>
            <button
              onClick={() => setCurrentView("loaned-books")}
              className={`flex flex-col items-center py-2 px-4 rounded-lg ${currentView === "loaned-books" ? "text-blue-600" : "text-gray-600"
                }`}
            >
              <span className="text-xl mb-1">🤝</span>
              <span className="text-xs">Emprestados</span>
            </button>
          </div>
        </nav>
      </Authenticated>

      <Toaster />
    </div>
  );
}

function Content({
  currentView,
  selectedBookId,
  onViewBook,
  onBackToLibrary,
  onNavigate
}: {
  currentView: View;
  selectedBookId: Id<"books"> | null;
  onViewBook: (bookId: Id<"books">) => void;
  onBackToLibrary: () => void;
  onNavigate: (view: View) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  switch (currentView) {
    case "library":
      return <BookLibrary onViewBook={onViewBook} />;
    case "add-book":
      return <BookForm onSuccess={() => onNavigate("library")} />;
    case "book-details":
      return selectedBookId ? (
        <BookDetails bookId={selectedBookId} onBack={onBackToLibrary} />
      ) : (
        <BookLibrary onViewBook={onViewBook} />
      );
    case "loaned-books":
      return <LoanedBooks onViewBook={onViewBook} />;
    default:
      return <BookLibrary onViewBook={onViewBook} />;
  }
}
