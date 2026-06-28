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
        <button :class="{ active: activeTab === 'leads' }" @click="activeTab = 'leads'">База Лідів (Досьє)</button>
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

      <div v-if="activeTab === 'leads'">
        <h2>Зібрані профілі (Ті, хто відповів)</h2>

        <div class="profile-card" style="margin-top: 20px; overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Мужик</th>
                <th>Вік / Країна</th>
                <th>Який текст спрацював?</th>
                <th>Анкета</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="leadsAnalytics.length === 0">
                <td colspan="4" style="text-align: center; color: #999; padding: 20px;">
                  Досьє ще збираються...
                </td>
              </tr>
              <tr v-for="(lead, idx) in leadsAnalytics" :key="idx">
                <td>
                  <img v-if="lead.photo" :src="lead.photo" alt="man_avatar" class="clickable-avatar"
                       title="Дивитись досьє чоловіка"
                       @click="viewJson(lead.man_json, 'Досьє Чоловіка ID: ' + lead.man_id)" />
                  <div v-else class="empty-avatar" @click="viewJson(lead.man_json, 'Досьє Чоловіка ID: ' + lead.man_id)"></div>
                </td>

                <td style="font-weight: bold;">
                  {{ lead.age }} р. <br/>
                  <span style="font-size: 0.85em; color: #666;">{{ lead.country }}</span>
                </td>

                <td style="text-align: left; max-width: 300px; white-space: normal; color: #2e7d32; font-style: italic;">
                  "{{ lead.text }}"
                </td>

                <td>
                  <img :src="getWomanPhoto(lead.woman_json)" alt="woman_avatar" class="clickable-avatar woman-border"
                       title="Дивитись досьє анкети"
                       @click="viewJson(lead.woman_json, 'Досьє Анкети ID: ' + lead.woman_id)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'stats'">
        <h2>Глобальна аналітика команди</h2>

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

        <div class="profile-card" style="margin-top: 20px;">
          <h3>Топ найефективніших інвайтів (Глобально)</h3>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Текст інвайту</th>
                <th>Відправлено (Усі ключі)</th>
                <th>Відповідей</th>
                <th>Конверсія (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="globalAnalytics.length === 0">
                <td colspan="4" style="text-align: center; color: #999; padding: 20px;">
                  Дані ще збираються...
                </td>
              </tr>
              <tr v-for="(stat, idx) in globalAnalytics" :key="idx">
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

      <div v-if="showJsonModal" class="modal-overlay" @click.self="closeJsonModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <button class="close-btn" @click="closeJsonModal">&times;</button>
          </div>
          <pre class="json-viewer">{{ currentJson }}</pre>
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

const leadsAnalytics = ref([])

const showJsonModal = ref(false)
const currentJson = ref('{}')
const modalTitle = ref('')

const viewJson = (rawJson, title) => {
  modalTitle.value = title
  try {
    const parsed = JSON.parse(rawJson || '{}')
    currentJson.value = Object.keys(parsed).length > 0
      ? JSON.stringify(parsed, null, 2)
      : '{"info": "Дані відсутні або ще не зібрані"}'
  } catch (e) {
    currentJson.value = rawJson || 'Немає даних'
  }
  showJsonModal.value = true
}

const closeJsonModal = () => {
  showJsonModal.value = false
}

const getWomanPhoto = (rawJson) => {
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  try {
    if (!rawJson) return placeholder
    const parsed = JSON.parse(rawJson)
    return parsed?.user_detail?.photo_link || placeholder
  } catch(e) {
    return placeholder
  }
}

const fetchLeads = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/admin/leads`, {
      headers: { 'admin-token': authStore.token }
    })
    if (response.data.status === 'success') {
      leadsAnalytics.value = response.data.leads
    }
  } catch (e) {
    console.error("Не вдалося завантажити досьє", e)
  }
}

// Не забудь додати fetchLeads() у onMounted, там де в тебе fetchUsers() !

const router = useRouter()
const authStore = useAuthStore()
const SERVER_URL = 'http://178.105.190.180:8000'

// СТАН ДОДАТКУ (Таби)
const activeTab = ref('keys') // 'keys', 'stats', 'profile'
const selectedUser = ref(null)

const users = ref([])
const loading = ref(true)
const error = ref('')
const globalAnalytics = ref([])

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

const fetchGlobalStats = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/admin/global_stats`, {
      headers: { 'admin-token': authStore.token }
    })
    if (response.data.status === 'success') {
      globalAnalytics.value = response.data.stats
    }
  } catch (e) {
    console.error("Не вдалося завантажити глобальну статистику", e)
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
  fetchLeads()
  fetchGlobalStats() // <--- Додали
  setInterval(fetchUsers, 10000)
  setInterval(fetchGlobalStats, 30000) // Оновлюємо топ кожні 30 сек
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

/* ========================================== */
/* МОДАЛЬНЕ ВІКНО ДЛЯ JSON                    */
/* ========================================== */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; backdrop-filter: blur(3px);
}
.modal-content {
  background: #fff; width: 850px; max-width: 90vw;
  height: 80vh; max-height: 800px;
  border-radius: 8px; display: flex; flex-direction: column;
  box-shadow: 0 15px 40px rgba(0,0,0,0.3);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px 20px; border-bottom: 1px solid #eee;
  background: #f8f9fa; border-radius: 8px 8px 0 0;
}
.modal-header h3 { margin: 0; color: #1976d2; font-size: 16px;}
.close-btn {
  background: none; border: none; font-size: 26px; cursor: pointer; color: #999; line-height: 1;
}
.close-btn:hover { color: #d32f2f; }
.json-viewer {
  padding: 20px; margin: 0; overflow-y: auto; flex: 1;
  background: #1e1e1e; /* Темний фон як у редакторі коду */
  color: #a6e22e; /* Зелений текст */
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px; border-radius: 0 0 8px 8px;
}

/* Ефекти для клікабельних аватарок */
.clickable-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}
.clickable-avatar:hover {
  transform: scale(1.15);
  border-color: #1976d2;
  box-shadow: 0 5px 15px rgba(25, 118, 210, 0.4);
}
.woman-border:hover {
  border-color: #e91e63; /* Рожевий акцент для анкети */
  box-shadow: 0 5px 15px rgba(233, 30, 99, 0.4);
}
.empty-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #eee;
  display: inline-block;
  cursor: pointer;
  transition: 0.2s;
}
.empty-avatar:hover {
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
.modal-title { margin: 0; color: #1976d2; font-size: 16px; font-weight: bold; }

</style>
