<template>
  <div id="container">
    <header><slot name="header">header-fallback</slot></header>
    <main><slot>default-fallback</slot></main>
  </div>
</template>
