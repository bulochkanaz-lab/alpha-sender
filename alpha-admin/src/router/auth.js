import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // При завантаженні шукаємо токен у пам'яті браузера
  const token = ref(localStorage.getItem('admin_token') || '')

  // Функція для збереження нового токена
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  // Функція для виходу
  const logout = () => {
    token.value = ''
    localStorage.removeItem('admin_token')
  }

  return { token, setToken, logout }
})
