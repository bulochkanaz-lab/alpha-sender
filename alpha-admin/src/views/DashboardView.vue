<template>
  <div style="padding: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Панель керування Alpha</h2>
      <button @click="logout" style="padding: 8px 15px; background: #ff4d4f; color: white; border: none; cursor: pointer;">Вийти</button>
    </div>

    <p v-if="loading">Завантаження даних...</p>
    <p v-else-if="error" style="color: red;">{{ error }}</p>

    <table v-else border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; background: white;">
      <thead style="background: #f0f0f0;">
        <tr>
          <th>ID</th>
          <th>Ключ</th>
          <th>HWID</th>
          <th>Баланс</th>
          <th>Бан</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" style="text-align: center;">
          <td>{{ user.id }}</td>
          <td style="font-family: monospace;">{{ user.access_key }}</td>
          <td>{{ user.hwid || '—' }}</td>
          <td>{{ user.balance }}</td>
          <td :style="{ color: user.is_banned ? 'red' : 'green' }">
            {{ user.is_banned ? 'Так' : 'Ні' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

// Змінні для зберігання стану сторінки
const users = ref([])
const loading = ref(true)
const error = ref('')

// Логіка виходу
const logout = () => {
  authStore.logout()
  router.push('/login')
}

// Запит на сервер за списком ключів
const fetchUsers = async () => {
  try {
    const response = await axios.get('http://178.105.190.180:8001/admin/keys', {
      headers: { 'admin-token': authStore.token }
    })

    if (response.data.status === 'success') {
      users.value = response.data.keys
    } else {
      error.value = 'Помилка отримання даних від сервера'
    }
  } catch (e) {
    error.value = 'Не вдалося з\'єднатися з бекендом. Перевір, чи запущений сервер.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Автоматично запускаємо функцію fetchUsers при відкритті сторінки
onMounted(() => {
  fetchUsers()
})
</script>
