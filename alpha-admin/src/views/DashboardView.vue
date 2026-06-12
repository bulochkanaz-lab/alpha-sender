<template>
  <div style="padding: 20px; position: relative;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Панель керування Alpha</h2>
      <button @click="logout" style="padding: 8px 15px; background: #ff4d4f; color: white; border: none; border-radius: 5px; cursor: pointer;">Вийти</button>
    </div>

    <p v-if="loading">Завантаження даних...</p>
    <p v-else-if="error" style="color: red;">{{ error }}</p>

    <table v-else border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <thead style="background: #f0f0f0;">
        <tr>
          <th>ID</th>
          <th>Ключ</th>
          <th>HWID</th>
          <th>Баланс</th>
          <th>Бан</th>
          <th>Інвайти</th> <th>Листи</th>   <th>Статус</th>  <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" style="text-align: center;">
          <td>{{ user.id }}</td>
          <td style="font-family: monospace; font-weight: bold; color: #333;">{{ user.access_key }}</td>
          <td style="color: #666;">{{ user.hwid || '—' }}</td>
          <td>{{ user.balance }}</td>
          <td :style="{ color: user.is_banned ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }">
            {{ user.is_banned ? 'Так' : 'Ні' }}
          </td>
          <td style="font-weight: bold; color: #f57c00;">{{ user.stats_invites || 0 }}</td>
          <td style="font-weight: bold; color: #2e7d32;">{{ user.stats_letters || 0 }}</td>
          <td>
            <span v-if="isOnline(user.last_ping)" style="color: #52c41a; font-weight: bold;">🟢 Онлайн</span>
            <span v-else style="color: #999;">🕒 {{ formatTime(user.last_ping) }}</span>
          </td>
          <td>
            <button @click="toggleBan(user.access_key)" style="margin-right: 5px; padding: 5px 10px; cursor: pointer;">
              {{ user.is_banned ? '🟢 Розбанити' : '🔴 Забанити' }}
            </button>
            <button @click="resetHwid(user.access_key)" style="margin-right: 5px; padding: 5px 10px; cursor: pointer;">
              🔄 Скинути HWID
            </button>
            <button @click="deleteKey(user.access_key)" style="padding: 5px 10px; cursor: pointer; color: white; background: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 3px;">
              🗑️ Видалити
            </button>
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

const users = ref([])
const loading = ref(true)
const error = ref('')

const SERVER_URL = 'http://178.105.190.180:8001'

const logout = () => {
  authStore.logout()
  router.push('/login')
}

// ==========================================
// ФУНКЦІЇ ДЛЯ ЧАСУ ТА СТАТУСУ (Винесли назовні!)
// ==========================================

// Перевіряє, чи був пінг менше 2 хвилин тому (120000 мілісекунд)
const isOnline = (timestamp) => {
  if (!timestamp) return false
  const pingTime = new Date(timestamp + 'Z').getTime()
  const now = Date.now()
  return (now - pingTime) < 120000
}

// Красиво форматує час (наприклад: 14:25)
const formatTime = (timestamp) => {
  if (!timestamp) return 'Офлайн'
  const date = new Date(timestamp + 'Z')
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

// ==========================================

const fetchUsers = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/admin/keys`, {
      headers: { 'admin-token': authStore.token }
    })

    if (response.data.status === 'success') {
      users.value = response.data.keys
    } else {
      error.value = 'Помилка отримання даних від сервера'
    }
  } catch (e) {
    error.value = 'Не вдалося з\'єднатися з бекендом.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// ==========================================
// ШВИДКІ ДІЇ
// ==========================================

const toggleBan = async (key) => {
  try {
    await axios.post(`${SERVER_URL}/admin/toggle_ban`, { access_key: key }, { headers: { 'admin-token': authStore.token } })
    fetchUsers()
  } catch (e) { console.error(e) }
}

const resetHwid = async (key) => {
  if (!confirm(`Точно скинути HWID для ${key}?`)) return
  try {
    await axios.post(`${SERVER_URL}/admin/reset_hwid`, { access_key: key }, { headers: { 'admin-token': authStore.token } })
    fetchUsers()
  } catch (e) { console.error(e) }
}

const deleteKey = async (key) => {
  if (!confirm(`Точно видалити ключ ${key}?`)) return
  try {
    await axios.post(`${SERVER_URL}/admin/delete_key`, { access_key: key }, { headers: { 'admin-token': authStore.token } })
    fetchUsers()
  } catch (e) { console.error(e) }
}

onMounted(() => {
  fetchUsers()
})
</script>
