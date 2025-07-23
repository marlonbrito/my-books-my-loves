import { Id } from "../../convex/_generated/dataModel";

interface Book {
  _id: Id<"books">;
  title: string;
  author: string;
  rating: number;
  isRead: boolean;
  isLoaned: boolean;
  coverUrl: string | null;
  genre: string;
}

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ♥
      </span>
    ));
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border hover:border-blue-200"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📖</div>
              <div className="text-xs font-medium text-gray-700 line-clamp-3">
                {book.title}
              </div>
            </div>
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.isRead && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              ✓ Lido
            </span>
          )}
          {book.isLoaned && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              🤝 Emprestado
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-1 mb-2">
          {book.author}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {renderStars(book.rating)}
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {book.genre}
          </span>
        </div>
      </div>
    </div>
  );
}
