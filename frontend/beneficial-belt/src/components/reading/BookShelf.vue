<template>
  <div class="shelf-root">
    <div v-if="books.length === 0" class="empty-shelf">
      <p>书架空空</p>
    </div>
    <div v-else class="book-grid">
      <div
        v-for="book in books"
        :key="book.id"
        class="book-card"
        @click="openBook(book)"
      >
        <div class="book-cover-placeholder">
          <span class="book-icon">📖</span>
        </div>
        <div class="book-info">
          <h3>{{ book.title }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const books = ref([]);

onMounted(async () => {
  const res = await fetch('/books/index.json');
  const data = await res.json();
  books.value = data.books || [];
});

const openBook = (book) => {
  window.location.href = `/read?book=${encodeURIComponent(book.id)}`;
};
</script>

<style scoped>
.shelf-root {
  padding: 20px 0;
}
.empty-shelf {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}
.book-card {
  cursor: pointer;
  transition: transform 0.2s;
  text-align: center;
}
.book-card:hover {
  transform: translateY(-4px);
}
.book-cover-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  background: var(--bg-card, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}
.book-info h3 {
  font-size: 0.85rem;
  margin: 8px 0 0;
  color: var(--text-primary);
}
</style>