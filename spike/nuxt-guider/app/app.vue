<template>
  <header>
    <NuxtLink to="/">Utpost</NuxtLink>
    <span class="muted"> · guiderna i Nuxt (spik)</span>
  </header>
  <main>
    <NuxtPage />
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  margin: 0 auto;
  max-width: 720px;
  padding: 16px;
}
img {
  width: 100%;
  height: auto;
  border-radius: 6px;
}
.muted {
  color: #666;
  font-size: 14px;
}
</style>
