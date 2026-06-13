<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="logo">⚙️ Alpha Admin</div>
      <nav class="nav-menu">
        <button
          :class="['nav-btn', { active: activeTab === 'keys' }]"
          @click="openTab('keys')">
          🔑 Список ключів
        </button>
        <button
          :class="['nav-btn', { active: activeTab === 'stats' }]"
          @click="openTab('stats')">
          📈 Глобальна статистика
        </button>
      </nav>
      <button class="logout-btn" @click="logout">🚪 Вийти</button>
    </aside>

    <main class="content-area">

      <div v-if="activeTab === 'keys'">
        <h2>Управління доступом</h2>
        <p v-if="loading">Завантаження даних...</p>
        <p v-else-if="error" class="text-error">{{ error }}</p>

        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ключ</th>
              <th>HWID</th>
              <th>Статус</th>
              <th>Бан</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td class="key-cell" @click="openUserProfile(user)" title="Натисніть для деталей">
                {{ user.access_key }} 🔍
              </td>
              <td class="muted">{{ user.hwid || '—' }}</td>
              <td>
                <span v-if="isOnline(user.last_ping)" class="badge success">🟢 Онлайн</span>
                <span v-else class="badge offline">🕒 {{ formatTime(user.last_ping) }}</span>
              </td>
              <td>
                <span :class="['badge', user.is_banned ? 'danger' : 'success']">
                  {{ user.is_banned ? 'Так' : 'Ні' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-small btn-warn" @click="toggleBan(user.access_key)">
                  {{ user.is_banned ? 'Розбанити' : 'Забанити' }}
                </button>
                <button class="btn-small" @click="resetHwid(user.access_key)">🔄 HWID</button>
                <button class="btn-small btn-danger" @click="deleteKey(user.access_key)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'stats'">
        <h2>Глобальна аналітика</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Всього інвайтів за сьогодні</h3>
            <div class="stat-number">{{ totalInvites }}</div>
          </div>
          <div class="stat-card">
            <h3>Всього листів за сьогодні</h3>
            <div class="stat-number">{{ totalLetters }}</div>
          </div>
        </div>
        <div style="margin-top: 30px; padding: 20px; background: #fff; border-radius: 8px; border: 1px dashed #ccc;">
          <p style="color: #666; text-align: center;">Тут будуть красиві графіки Chart.js (відправки по годинах та конверсія текстів)</p>
        </div>
      </div>

      <div v-if="activeTab === 'profile' && selectedUser">
        <div class="profile-header">
          <button class="btn-back" @click="openTab('keys')">⬅ Повернутися до списку</button>
          <h2>Деталі ключа: <span class="highlight">{{ selectedUser.access_key }}</span></h2>
        </div>

        <div class="profile-layout">
          <div class="profile-card">
            <h3>Інформація</h3>
            <p><strong>ID:</strong> {{ selectedUser.id }}</p>
            <p><strong>Баланс:</strong> {{ selectedUser.balance }}</p>
            <p><strong>Остання активність:</strong> {{ formatTime(selectedUser.last_ping) }}</p>
            <p><strong>HWID:</strong> {{ selectedUser.hwid || 'Не прив\'язано' }}</p>
          </div>

          <div class="profile-card">
            <h3>Активність за поточну сесію</h3>
            <div style="display: flex; gap: 20px; margin-top: 15px;">
              <div class="mini-stat">
                <span>Інвайти</span>
                <strong>{{ selectedUser.stats_invites || 0 }}</strong>
              </div>
              <div class="mini-stat">
                <span>Листи</span>
                <strong>{{ selectedUser.stats_letters || 0 }}</strong>
              </div>
            </div>
          </div>

          <div class="profile-card" style="grid-column: 1 / -1;">
            <h3>Ефективність шаблонів</h3>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Текст інвайту</th>
                  <th>Відправлено</th>
                  <th>Відповідей</th>
                  <th>Конверсія (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!selectedUser.invite_analytics || selectedUser.invite_analytics.length === 0">
                  <td colspan="4" style="text-align: center; color: #999; padding: 20px;">
                    Дані збираються... Розширення ще не відправило жодного інвайту.
                  </td>
                </tr>
                <tr v-for="(stat, idx) in selectedUser.invite_analytics" :key="idx">
                  <td style="text-align: left; max-width: 450px; white-space: normal; word-break: break-word;">
                    {{ stat.text }}
                  </td>
                  <td style="font-weight: bold; color: #f57c00;">{{ stat.sent }}</td>
                  <td style="font-weight: bold; color: #2e7d32;">{{ stat.replied }}</td>
                  <td :style="{ color: stat.conversion >= 10 ? '#52c41a' : '#faad14', fontWeight: 'bold' }">
                    {{ stat.conversion }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const SERVER_URL = 'http://178.105.190.180:8001'

// СТАН ДОДАТКУ (Таби)
const activeTab = ref('keys') // 'keys', 'stats', 'profile'
const selectedUser = ref(null)

const users = ref([])
const loading = ref(true)
const error = ref('')

// ==========================================
// ФУНКЦІЇ ДЛЯ ЧАСУ ТА СТАТУСУ
// ==========================================
const isOnline = (timestamp) => {
  if (!timestamp) return false
  const pingTime = new Date(timestamp + 'Z').getTime()
  const now = Date.now()
  return (now - pingTime) < 120000
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Офлайн'
  const date = new Date(timestamp + 'Z')
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

// ОБЧИСЛЕННЯ ГЛОБАЛЬНОЇ СТАТИСТИКИ
const totalInvites = computed(() => users.value.reduce((sum, u) => sum + (u.stats_invites || 0), 0))
const totalLetters = computed(() => users.value.reduce((sum, u) => sum + (u.stats_letters || 0), 0))

// ==========================================
// ЛОГІКА НАВІГАЦІЇ
// ==========================================
const openTab = (tabName) => {
  activeTab.value = tabName
  if (tabName !== 'profile') selectedUser.value = null
}

const openUserProfile = (user) => {
  selectedUser.value = user
  activeTab.value = 'profile'
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

// ==========================================
// РОБОТА З API
// ==========================================
const fetchUsers = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/admin/keys`, {
      headers: { 'admin-token': authStore.token }
    })
    if (response.data.status === 'success') {
      users.value = response.data.keys
      // Якщо відкритий профіль, оновлюємо його дані теж
      if (selectedUser.value) {
        selectedUser.value = users.value.find(u => u.access_key === selectedUser.value.access_key)
      }
    } else {
      error.value = 'Помилка отримання даних від сервера'
    }
  } catch (e) {
    error.value = 'Не вдалося з\'єднатися з бекендом.'
  } finally {
    loading.value = false
  }
}

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
  // Оновлюємо дані кожні 10 секунд (щоб онлайн світився актуально)
  setInterval(fetchUsers, 10000)
})
</script>

<style scoped>
/* СУЧАСНИЙ ДИЗАЙН (CSS) */
.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: #f4f6f8;
  font-family: 'Segoe UI', Tahoma, sans-serif;
}

.sidebar {
  width: 250px;
  background: #ffffff;
  border-right: 1px solid #e1e8ed;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  font-size: 20px;
  font-weight: bold;
  color: #1976d2;
  border-bottom: 1px solid #e1e8ed;
}

.nav-menu {
  flex: 1;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.nav-btn {
  padding: 15px 20px;
  background: none;
  border: none;
  text-align: left;
  font-size: 15px;
  cursor: pointer;
  color: #555;
  border-left: 4px solid transparent;
  transition: 0.2s;
}

.nav-btn:hover { background: #f0f4f8; }
.nav-btn.active { background: #e3f2fd; color: #1976d2; border-left-color: #1976d2; font-weight: bold; }

.logout-btn {
  padding: 15px;
  background: #fff0f0;
  color: #d32f2f;
  border: none;
  border-top: 1px solid #e1e8ed;
  cursor: pointer;
  font-weight: bold;
}

.content-area {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

h2 { margin-top: 0; color: #333; }

/* Таблиці */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.admin-table th, .admin-table td {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.admin-table th { background: #fafafa; font-weight: 600; color: #555; }
.admin-table tr:hover { background: #fdfdfd; }

.key-cell {
  font-family: monospace;
  font-weight: bold;
  color: #1976d2;
  cursor: pointer;
}
.key-cell:hover { text-decoration: underline; }

.muted { color: #999; }

/* Бейджики */
.badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
.badge.success { background: #e8f5e9; color: #2e7d32; }
.badge.danger { background: #ffebee; color: #c62828; }
.badge.offline { background: #f5f5f5; color: #757575; }

/* Кнопки в таблиці */
.btn-small { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #fff; transition: 0.2s; }
.btn-small:hover { background: #f0f0f0; }
.btn-warn { color: #ed6c02; border-color: #ed6c02; }
.btn-danger { color: #d32f2f; border-color: #d32f2f; }

/* Статистика і Профіль */
.stats-grid { display: flex; gap: 20px; }
.stat-card { flex: 1; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }
.stat-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; }
.stat-number { font-size: 36px; font-weight: bold; color: #1976d2; }

.profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.btn-back { padding: 8px 15px; border-radius: 6px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
.highlight { color: #1976d2; }

.profile-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.profile-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.mini-stat { background: #f4f6f8; padding: 15px; border-radius: 6px; flex: 1; display: flex; flex-direction: column; align-items: center; }
.mini-stat span { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
.mini-stat strong { font-size: 24px; color: #333; }
</style>
