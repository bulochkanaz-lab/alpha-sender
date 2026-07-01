<template>
  <div style="text-align: center; margin-top: 100px;">
    <h2>Вхід в систему Alpha</h2>
    <input
      v-model="inputToken"
      type="password"
      placeholder="Секретний токен"
      style="padding: 8px; margin-right: 10px;"
      @keyup.enter="login"
    />
    <button @click="login" style="padding: 8px 15px;">Увійти</button>

    <p v-if="errorMessage" style="color: red; margin-top: 15px;">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const inputToken = ref('')
const errorMessage = ref('')
const router = useRouter()
const authStore = useAuthStore()

const login = async () => {
  errorMessage.value = '' // Очищаємо стару помилку перед новим запитом

  if (!inputToken.value) {
    errorMessage.value = 'Введи токен!'
    return
  }

  try {
    // Стукаємо на твій локальний сервер 8001
    // Передаємо токен у заголовку admin-token, як того вимагає твій FastAPI
    const response = await axios.get('http://178.105.190.180:8000/admin/keys', {
      headers: { 'admin-token': inputToken.value }
    })

    // Якщо сервер відповів без помилок (статус 200)
    if (response.data.status === 'success') {
      authStore.setToken(inputToken.value) // Ховаємо токен у "сейф"
      router.push('/dashboard') // Перекидаємо на дашборд
    }
  } catch (error) {
    // Якщо сервер повернув 401 Unauthorized
    errorMessage.value = 'Невірний токен! Доступ заборонено.'
    console.error('Помилка авторизації:', error)
  }
}
</script>
