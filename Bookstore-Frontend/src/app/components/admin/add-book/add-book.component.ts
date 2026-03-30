import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { BrowseService } from '../../../services/browse.service';

interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-add-book',
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.css']
})
export class AddBookComponent implements OnInit {

  addBookForm: FormGroup;

  categories: string[] = [];
  languages: Language[] = [];

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  fileName: string = '';
  fileSize: string = '';

  isLoading = false;
  isEditMode = false;
  bookId: number | null = null;
  successMessage = '';
  errorMessage = '';
  currentYear: number = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bookService: BookService,
    private browseService: BrowseService
  ) {

    this.addBookForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      author: ['', [Validators.required, Validators.minLength(2)]],
      isbn: ['', Validators.required],
      year: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      publisher: [''],
      language: ['English']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadLanguages();
    
    // Check if we are in Edit Mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.bookId = +params['id'];
        this.loadBookDetails(this.bookId);
      }
    });
  }

  loadBookDetails(id: number): void {
    this.isLoading = true;
    this.bookService.getBookById(id).subscribe({
      next: (book) => {
        this.addBookForm.patchValue({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          year: book.publicationYear,
          description: book.description,
          category: book.category,
          price: book.price,
          stock: book.stock,
          publisher: book.publisher,
          language: book.language
        });
        if (book.coverImage) {
          this.imagePreview = book.coverImage;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Failed to load book details.";
        this.isLoading = false;
      }
    });
  }

  // ============================
  // SUBMIT (FIXED VERSION)
  // ============================
  onSubmit(): void {

    if (this.addBookForm.invalid) {
      this.markFormGroupTouched(this.addBookForm);
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValue = this.addBookForm.value;

    // 🔥 MAP FRONTEND FIELDS TO BACKEND MODEL
    const bookData = {
      title: formValue.title,
      author: formValue.author,
      isbn: formValue.isbn,
      publicationYear: formValue.year ? Number(formValue.year) : 0,
      description: formValue.description,
      category: formValue.category,
      price: Number(formValue.price),
      stock: Number(formValue.stock),
      publisher: formValue.publisher,
      language: formValue.language,
      coverImage: this.imagePreview || null
    };

    if (this.isEditMode && this.bookId) {
      this.bookService.updateBook(this.bookId, bookData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = "Book updated successfully!";
          setTimeout(() => {
            this.router.navigate(['/admin/books']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          this.errorMessage = "Failed to update book.";
        }
      });
    } else {
      this.bookService.addBook(bookData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = "Book added successfully!";

          this.addBookForm.reset();
          this.removeImage();

          setTimeout(() => {
            this.router.navigate(['/admin/books']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          this.errorMessage = "Failed to add book. Please check backend.";
        }
      });
    }
  }

  // ======================
  // SIDEBAR & LOGOUT
  // ======================
  toggleSidebar(): void {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar?.classList.toggle('collapsed');
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ======================
  // CATEGORY & LANGUAGE
  // ======================
  loadCategories(): void {
    this.browseService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  loadLanguages(): void {
    this.languages = [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'fr', name: 'French' }
    ];
  }

  // ======================
  // IMAGE HANDLING
  // ======================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.fileName = '';
    this.fileSize = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.onFileSelected({
        target: { files: [file] }
      } as unknown as Event);
    }
  }

  formatFileSize(bytes: number): string {
    const kb = bytes / 1024;
    return kb.toFixed(2) + ' KB';
  }

  generateISBN(): void {
    let isbn = '978';
    for (let i = 0; i < 10; i++) {
      isbn += Math.floor(Math.random() * 10);
    }
    this.addBookForm.patchValue({ isbn });
  }

  fillSampleData(): void {
    this.addBookForm.patchValue({
      title: 'Sample Book',
      author: 'John Doe',
      isbn: '9781234567890',
      year: 2024,
      description: 'This is a sample book description for testing purposes.',
      category: 'Fiction',
      price: 499,
      stock: 20,
      language: 'English'
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // ======================
  // GETTERS
  // ======================
  get title() { return this.addBookForm.get('title'); }
  get author() { return this.addBookForm.get('author'); }
  get isbn() { return this.addBookForm.get('isbn'); }
  get description() { return this.addBookForm.get('description'); }
  get category() { return this.addBookForm.get('category'); }
  get price() { return this.addBookForm.get('price'); }
  get stock() { return this.addBookForm.get('stock'); }

}