function openPopup(imageUrl, title) {
    document.getElementById('popupImage').src = imageUrl;
    document.getElementById('popupTitle').innerText = title;
    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

async function searchBooks() {
    const query = document.getElementById('search').value;
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
    const data = await response.json();
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    data.items.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';
        bookElement.innerHTML = `
            <img src="${book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/100'}" alt="Book Cover" onclick="openPopup('${book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/100'}', '${book.volumeInfo.title}')">
            <h3>${book.volumeInfo.title}</h3>
            <button onclick="addToLibrary('${book.id}')">Add to Library</button>
        `;
        resultsDiv.appendChild(bookElement);
    });
}

function addToLibrary(bookId) {
    let library = JSON.parse(localStorage.getItem('library')) || [];
    if (!library.includes(bookId)) {
        library.push(bookId);
        localStorage.setItem('library', JSON.stringify(library));
    }
    displayLibrary();
}

function removeFromLibrary(bookId) {
    let library = JSON.parse(localStorage.getItem('library')) || [];
    library = library.filter(id => id !== bookId);
    localStorage.setItem('library', JSON.stringify(library));
    displayLibrary();
}

async function displayLibrary() {
    const library = JSON.parse(localStorage.getItem('library')) || [];
    const libraryDiv = document.getElementById('library');
    libraryDiv.innerHTML = '<p>Loading books...</p>';
    
    if (library.length === 0) {
        libraryDiv.innerHTML = `<p id="no-book">[no books in your library]</p>`;
        return;
    }

    let storedBooks = JSON.parse(localStorage.getItem('libraryBooks')) || {};
    let booksToFetch = library.filter(id => !storedBooks[id]);

    if (booksToFetch.length > 0) {
        const bookPromises = booksToFetch.map(bookId =>
            fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
                .then(res => res.json())
                .then(book => ({ id: bookId, data: book }))
                .catch(() => null)
        );

        const fetchedBooks = await Promise.allSettled(bookPromises);

        fetchedBooks.forEach(result => {
            if (result.status === "fulfilled" && result.value) {
                storedBooks[result.value.id] = result.value.data;
            }
        });

        localStorage.setItem('libraryBooks', JSON.stringify(storedBooks));
    }

    libraryDiv.innerHTML = '';
    library.forEach(bookId => {
        const book = storedBooks[bookId];
        if (book) {
            const bookElement = document.createElement('div');
            bookElement.className = 'book';
            bookElement.innerHTML = `
                <img src="${book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/100'}" 
                     alt="Book Cover" 
                     onclick="openPopup('${book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/100'}', '${book.volumeInfo.title}')">
                <h3>${book.volumeInfo.title}</h3>
                <button onclick="removeFromLibrary('${bookId}')">Remove</button>
            `;
            libraryDiv.appendChild(bookElement);
        }
    });
}

function scrollToLibrary() {
    document.querySelector('.library-heading').scrollIntoView({ behavior: 'smooth' });
}

function scrollToRec() {
    document.querySelector('.rec-heading').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', displayLibrary);