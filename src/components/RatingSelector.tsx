// components/RatingSelector.tsx

import { useState } from "react";

interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function RatingSelector({ value, onChange }: RatingSelectorProps) {
  const [hover, setHover] = useState(0);

  const labels: Record<number, string> = {
    1: "Ruim 😖",
    2: "Dá pro gasto 😐",
    3: "Bom 🙂",
    4: "Apaixonante 😍",
    5: "Perfeito! 🤩",
  };

  const current = hover || value;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className={`text-2xl transition-transform hover:scale-125 ${
              i <= current ? "text-pink-500" : "text-gray-300"
            }`}
          >
            ♥
          </button>
        ))}
      </div>
      {current > 0 && (
        <span className="text-sm text-gray-700 font-medium min-w-[120px]">
          {labels[current]}
        </span>
      )}
    </div>
  );
}
