<template>
  <div style="padding: 20px;">
    <h2>Панель керування</h2>
    <p>Тут скоро буде таблиця з користувачами та налаштуваннями.</p>
    <button @click="logout">Вийти</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  router.push('/login')
}
</script>
