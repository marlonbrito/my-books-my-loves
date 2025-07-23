import { action } from "./_generated/server";
import { v } from "convex/values";

// Helper function to search by ISBN (shared logic)
async function searchBookByISBNHelper(isbn: string) {
  try {
    // Try Google Books API first
    const googleResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    
    if (googleResponse.ok) {
      const googleData = await googleResponse.json();
      if (googleData.items && googleData.items.length > 0) {
        const book = googleData.items[0].volumeInfo;
        
        // Get the best quality cover image URL
        let coverImageUrl = null;
        if (book.imageLinks) {
          // Prefer higher quality images
          coverImageUrl = book.imageLinks.large || 
                        book.imageLinks.medium || 
                        book.imageLinks.thumbnail || 
                        book.imageLinks.smallThumbnail;
          
          // Convert to HTTPS and higher resolution if possible
          if (coverImageUrl) {
            coverImageUrl = coverImageUrl.replace('http://', 'https://');
            // Try to get higher resolution by modifying the URL
            coverImageUrl = coverImageUrl.replace('&zoom=1', '&zoom=0');
          }
        }
        
        return {
          title: book.title || "",
          author: book.authors ? book.authors.join(", ") : "",
          summary: book.description || "",
          publishedYear: book.publishedDate ? parseInt(book.publishedDate.split("-")[0]) : undefined,
          publisher: book.publisher || "",
          pageCount: book.pageCount || undefined,
          language: book.language === 'pt' ? 'Português' : book.language || "",
          coverImageUrl,
          genre: book.categories ? book.categories[0] : "",
          isbn: book.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier || 
                book.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier || isbn,
        };
      }
    }

    // Fallback to Open Library API
    const openLibResponse = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    
    if (openLibResponse.ok) {
      const openLibData = await openLibResponse.json();
      const bookKey = `ISBN:${isbn}`;
      
      if (openLibData[bookKey]) {
        const book = openLibData[bookKey];
        
        // Get cover image from Open Library
        let coverImageUrl = null;
        if (book.cover) {
          coverImageUrl = book.cover.large || book.cover.medium || book.cover.small;
        }
        
        return {
          title: book.title || "",
          author: book.authors ? book.authors.map((a: any) => a.name).join(", ") : "",
          summary: book.excerpts ? book.excerpts[0].text : "",
          publishedYear: book.publish_date ? parseInt(book.publish_date) : undefined,
          publisher: book.publishers ? book.publishers[0].name : "",
          pageCount: book.number_of_pages || undefined,
          language: "",
          coverImageUrl,
          genre: book.subjects ? book.subjects[0].name : "",
          isbn: isbn,
        };
      }
    }

    // Additional fallback: Try Open Library cover API directly
    const coverResponse = await fetch(
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    );
    
    if (coverResponse.ok && coverResponse.headers.get('content-type')?.includes('image')) {
      return {
        title: "",
        author: "",
        summary: "",
        publishedYear: undefined,
        publisher: "",
        pageCount: undefined,
        language: "",
        coverImageUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
        genre: "",
        isbn: isbn,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching book data:", error);
    return null;
  }
}

// Helper function to convert EAN-13 to ISBN-10
function convertEAN13ToISBN10(ean13: string): string | null {
  if (!ean13.startsWith('978') || ean13.length !== 13) {
    return null;
  }
  
  // Remove the 978 prefix and check digit
  const isbn9 = ean13.substring(3, 12);
  
  // Calculate ISBN-10 check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn9[i]) * (10 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 11;
  const checkChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return isbn9 + checkChar;
}

export const searchBookByISBN = action({
  args: { isbn: v.string() },
  handler: async (ctx, args) => {
    return await searchBookByISBNHelper(args.isbn);
  },
});

export const searchBookByTitle = action({
  args: { title: v.string(), author: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const query = args.author 
        ? `intitle:${args.title}+inauthor:${args.author}`
        : `intitle:${args.title}`;
        
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const book = data.items[0].volumeInfo;
          
          // Get the best quality cover image URL
          let coverImageUrl = null;
          if (book.imageLinks) {
            coverImageUrl = book.imageLinks.large || 
                          book.imageLinks.medium || 
                          book.imageLinks.thumbnail || 
                          book.imageLinks.smallThumbnail;
            
            if (coverImageUrl) {
              coverImageUrl = coverImageUrl.replace('http://', 'https://');
              coverImageUrl = coverImageUrl.replace('&zoom=1', '&zoom=0');
            }
          }
          
          return {
            title: book.title || "",
            author: book.authors ? book.authors.join(", ") : "",
            summary: book.description || "",
            publishedYear: book.publishedDate ? parseInt(book.publishedDate.split("-")[0]) : undefined,
            publisher: book.publisher || "",
            pageCount: book.pageCount || undefined,
            language: book.language === 'pt' ? 'Português' : book.language || "",
            coverImageUrl,
            genre: book.categories ? book.categories[0] : "",
            isbn: book.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier || 
                  book.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier || "",
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching book data:", error);
      return null;
    }
  },
});

export const searchBookByBarcode = action({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    try {
      // Barcode is typically the same as ISBN for books
      // First, try to use it directly as ISBN
      const isbnResult = await searchBookByISBNHelper(args.barcode);
      if (isbnResult) {
        return isbnResult;
      }

      // If direct ISBN search fails, try different barcode formats
      // EAN-13 barcodes for books often start with 978 or 979
      let cleanBarcode = args.barcode.replace(/\D/g, ''); // Remove non-digits
      
      // If it's a 13-digit EAN starting with 978 or 979, it's likely an ISBN-13
      if (cleanBarcode.length === 13 && (cleanBarcode.startsWith('978') || cleanBarcode.startsWith('979'))) {
        const isbn13Result = await searchBookByISBNHelper(cleanBarcode);
        if (isbn13Result) {
          return isbn13Result;
        }
      }

      // Try converting EAN-13 to ISBN-10 if it starts with 978
      if (cleanBarcode.length === 13 && cleanBarcode.startsWith('978')) {
        const isbn10 = convertEAN13ToISBN10(cleanBarcode);
        if (isbn10) {
          const isbn10Result = await searchBookByISBNHelper(isbn10);
          if (isbn10Result) {
            return isbn10Result;
          }
        }
      }

      // Try UPC-A format (12 digits) - sometimes used for books
      if (cleanBarcode.length === 12) {
        // Try adding a leading zero to make it EAN-13
        const ean13 = '0' + cleanBarcode;
        const upcResult = await searchBookByISBNHelper(ean13);
        if (upcResult) {
          return upcResult;
        }
      }

      // Last resort: try Google Books API with the raw barcode
      const googleResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(args.barcode)}`
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items.length > 0) {
          const book = googleData.items[0].volumeInfo;
          
          let coverImageUrl = null;
          if (book.imageLinks) {
            coverImageUrl = book.imageLinks.large || 
                          book.imageLinks.medium || 
                          book.imageLinks.thumbnail || 
                          book.imageLinks.smallThumbnail;
            
            if (coverImageUrl) {
              coverImageUrl = coverImageUrl.replace('http://', 'https://');
              coverImageUrl = coverImageUrl.replace('&zoom=1', '&zoom=0');
            }
          }
          
          return {
            title: book.title || "",
            author: book.authors ? book.authors.join(", ") : "",
            summary: book.description || "",
            publishedYear: book.publishedDate ? parseInt(book.publishedDate.split("-")[0]) : undefined,
            publisher: book.publisher || "",
            pageCount: book.pageCount || undefined,
            language: book.language === 'pt' ? 'Português' : book.language || "",
            coverImageUrl,
            genre: book.categories ? book.categories[0] : "",
            isbn: book.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier || 
                  book.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier || args.barcode,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching book data by barcode:", error);
      return null;
    }
  },
});

export const downloadAndSaveCoverImage = action({
  args: { imageUrl: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }
      
      const imageBuffer = await response.arrayBuffer();
      const blob = new Blob([imageBuffer], { type: contentType });
      
      // Generate upload URL and upload the image
      const uploadUrl = await ctx.storage.generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }
      
      const { storageId } = await uploadResponse.json();
      return storageId;
    } catch (error) {
      console.error("Error downloading and saving cover image:", error);
      return null;
    }
  },
});
