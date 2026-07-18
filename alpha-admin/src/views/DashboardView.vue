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
        <button
          :class="['nav-btn', { active: activeTab === 'leads' }]"
          @click="openTab('leads')">
          База Лідів (Досьє)
        </button>
        <button
          :class="['nav-btn', { active: activeTab === 'metrics' }]"
          @click="openTab('metrics')">
          📊 Метрики
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
              <td>
                <div class="flex gap-2 justify-end">
                  <button
                    @click.stop="toggleBan(user.access_key)"
                    class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                    :class="user.is_banned
                      ? 'border-emerald-600 text-emerald-400 hover:bg-emerald-950'
                      : 'border-orange-600 text-orange-400 hover:bg-orange-950'">
                    {{ user.is_banned ? 'Розбанити' : 'Забанити' }}
                  </button>

                  <button
                    @click.stop="resetHwid(user.access_key)"
                    class="px-3 py-1.5 text-xs rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors">
                    HWID
                  </button>

                  <button
                    @click.stop="deleteKey(user.access_key)"
                    class="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-400 hover:bg-red-950 transition-colors">
                    Видалити
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'leads'">
        <div class="mb-8">
          <div class="flex items-end justify-between">
            <div>
              <h2 class="text-3xl font-semibold tracking-tight">База Лідів</h2>
              <p class="text-zinc-400 mt-1">Чоловіки, які відповіли на інвайти</p>
            </div>

            <!-- Загальна кількість відповідей -->
            <div class="text-right">
              <div class="text-sm text-zinc-400">Всього відповідей</div>
              <div class="text-5xl font-semibold text-emerald-400 tracking-tighter">
                {{ leadsAnalytics.length }}
              </div>
              <div class="text-xs text-zinc-500 mt-0.5">за весь час</div>
            </div>
          </div>
        </div>

        <div class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-zinc-950 border-b border-zinc-800 text-sm">
                <th class="px-6 py-4 text-left font-medium text-zinc-400">Фото</th>
                <th class="px-6 py-4 text-left font-medium text-zinc-400">Вік / Країна</th>
                <th class="px-6 py-4 text-left font-medium text-zinc-400">Текст, що спрацював</th>
                <th class="px-6 py-4 text-left font-medium text-zinc-400">Анкета</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
              <tr v-if="leadsAnalytics.length === 0">
                <td colspan="4" class="px-6 py-10 text-center text-zinc-500">
                  Досьє ще збираються...
                </td>
              </tr>

              <tr v-for="(lead, idx) in leadsAnalytics" :key="idx">
                <!-- Фото чоловіка -->
                <td class="px-6 py-4">
                  <div
                    class="w-12 h-12 rounded-full overflow-hidden border border-zinc-700 cursor-pointer hover:border-emerald-500 transition-all"
                    @click="viewJson(lead.man_json, 'Досьє Чоловіка ID: ' + lead.man_id)">
                    <img
                      v-if="lead.photo"
                      :src="lead.photo"
                      alt="man_avatar"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                      ?
                    </div>
                  </div>
                </td>

                <!-- Вік / Країна -->
                <td class="px-6 py-4">
                  <div class="font-semibold">{{ lead.age }} років</div>
                  <div class="text-sm text-zinc-400">{{ lead.country }}</div>
                </td>

                <!-- Текст -->
                <td class="px-6 py-4 text-emerald-400 italic max-w-[380px]">
                  "{{ lead.text }}"
                </td>

                <!-- Фото анкети -->
                <td class="px-6 py-4">
                  <div
                    class="w-12 h-12 rounded-full overflow-hidden border border-pink-500/30 cursor-pointer hover:border-pink-500 transition-all"
                    @click="viewJson(lead.woman_json, 'Досьє Анкети ID: ' + lead.woman_id)">
                    <img
                      v-if="getWomanPhoto(lead.woman_json)"
                      :src="getWomanPhoto(lead.woman_json)"
                      alt="woman_avatar"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                      ?
                    </div>
                  </div>
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

      <!-- ==================== МЕТРИКИ ==================== -->
      <div v-if="activeTab === 'metrics'">
        <div class="mb-8">
          <h2 class="text-3xl font-semibold tracking-tight">Метрики</h2>
          <p class="text-zinc-400 mt-1">Аналітика ефективності</p>
        </div>

        <!-- Топ ключів за лідів -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-semibold text-xl">Топ ключів за кількістю лідів</h3>
              <p class="text-sm text-zinc-400 mt-1">Які ключі приносять найбільше відповідей</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-semibold text-emerald-400">{{ topKeysByLeads.length }}</div>
              <div class="text-xs text-zinc-500">ключів у топі</div>
            </div>
          </div>

          <div v-if="topKeysByLeads.length === 0" class="py-12 text-center text-zinc-500">
            Поки що немає даних для відображення
          </div>

          <VueApexCharts
            v-else
            type="bar"
            height="420"
            :options="topKeysChartOptions"
            :series="[{
              name: 'Кількість лідів',
              data: topKeysByLeads.map(k => k.count)
            }]"
          />
        </div>

        <!-- ==================== ЛІДИ ЗА ДНЯМИ ==================== -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-xl">Ліди за днями</h3>

            <!-- Селектор днів -->
            <div class="flex gap-2">
              <button
                v-for="d in [7, 14, 30]"
                :key="d"
                @click="fetchLeadsByDay(d)"
                :class="[
                  'px-4 py-1.5 text-sm rounded-xl transition-colors',
                  leadsByDayPeriod === d
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                ]">
                {{ d }} днів
              </button>
            </div>
          </div>

          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div v-if="leadsByDayLoading" class="flex justify-center items-center h-[320px]">
              <div class="text-zinc-400">Завантаження...</div>
            </div>

            <div v-else-if="leadsByDayData.length === 0" class="flex justify-center items-center h-[320px] text-zinc-500">
              Немає даних за обраний період
            </div>

            <VueApexCharts
              v-else
              type="bar"
              height="320"
              :options="leadsByDayChartOptions"
              :series="[{
                name: 'Кількість лідів',
                data: leadsByDayData.map(item => item.count)
              }]"
            />
          </div>
        </div>

        <!-- ==================== ІНВАЙТИ ЗА ДНЯМИ ==================== -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-xl">Інвайти за днями</h3>

            <div class="flex gap-2">
              <button
                v-for="d in [7, 14, 30]"
                :key="d"
                @click="fetchInvitesByDay(d)"
                :class="[
                  'px-4 py-1.5 text-sm rounded-xl transition-colors',
                  invitesByDayPeriod === d
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                ]">
                {{ d }} днів
              </button>
            </div>
          </div>

          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div v-if="invitesByDayLoading" class="flex justify-center items-center h-[320px]">
              <div class="text-zinc-400">Завантаження...</div>
            </div>

            <div v-else-if="invitesByDayData.length === 0" class="flex justify-center items-center h-[320px] text-zinc-500">
              Немає даних за обраний період
            </div>

            <VueApexCharts
              v-else
              type="bar"
              height="320"
              :options="invitesByDayChartOptions"
              :series="[{
                name: 'Кількість інвайтів',
                data: invitesByDayData.map(item => item.count)
              }]"
            />
          </div>
        </div>

        <!-- Інформація -->
        <div class="mt-6 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p>
            Графік показує топ-10 ключів, які зібрали найбільшу кількість відповідей (лідів) за весь час.
          </p>
        </div>
      </div>

      <div v-if="activeTab === 'profile' && selectedUser">
        <div class="flex items-center gap-4 mb-8">
          <button @click="openTab('keys')"
                  class="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
            ← Назад до списку
          </button>
          <h2 class="text-2xl font-semibold">Профіль ключа:
            <span class="text-emerald-400 font-mono">{{ selectedUser.access_key }}</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Інформація -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 class="font-semibold mb-4 text-lg">Інформація</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-zinc-400">ID</span>
                <span class="font-mono">{{ selectedUser.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-400">Баланс</span>
                <span>{{ selectedUser.balance || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-400">Остання активність</span>
                <span>{{ formatTime(selectedUser.last_ping) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-400">HWID</span>
                <span class="font-mono text-xs break-all">{{ selectedUser.hwid || 'Не прив\'язано' }}</span>
              </div>
            </div>
          </div>

          <!-- Активність -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 class="font-semibold mb-4 text-lg">Активність за сесію</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-zinc-400 text-sm">Інвайти</div>
                <div class="text-3xl font-semibold text-orange-400 mt-1">
                  {{ selectedUser.stats_invites || 0 }}
                </div>
              </div>
              <div>
                <div class="text-zinc-400 text-sm">Листи</div>
                <div class="text-3xl font-semibold text-emerald-400 mt-1">
                  {{ selectedUser.stats_letters || 0 }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Ефективність шаблонів -->
        <div class="mt-8">
          <h3 class="font-semibold mb-4 text-lg">Ефективність шаблонів</h3>
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-zinc-950 border-b border-zinc-800">
                  <th class="px-6 py-4 text-left">Текст інвайту</th>
                  <th class="px-6 py-4 text-center">Відправлено</th>
                  <th class="px-6 py-4 text-center">Відповідей</th>
                  <th class="px-6 py-4 text-center">Конверсія</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                <tr v-if="!selectedUser.invite_analytics || selectedUser.invite_analytics.length === 0">
                  <td colspan="4" class="px-6 py-8 text-center text-zinc-500">
                    Дані ще збираються...
                  </td>
                </tr>
                <tr v-for="(stat, idx) in selectedUser.invite_analytics" :key="idx">
                  <td class="px-6 py-4 max-w-[500px]">{{ stat.text }}</td>
                  <td class="px-6 py-4 text-center font-semibold text-orange-400">{{ stat.sent }}</td>
                  <td class="px-6 py-4 text-center font-semibold text-emerald-400">{{ stat.replied }}</td>
                  <td class="px-6 py-4 text-center font-bold"
                      :class="stat.conversion >= 10 ? 'text-emerald-400' : 'text-yellow-400'">
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
  try {
    if (!rawJson) return null

    const parsed = JSON.parse(rawJson)

    // Спочатку шукаємо photo_link на верхньому рівні
    if (parsed?.photo_link) {
      return parsed.photo_link
    }

    // Якщо немає — шукаємо всередині user_detail (старий варіант)
    if (parsed?.user_detail?.photo_link) {
      return parsed.user_detail.photo_link
    }

    return null
  } catch (e) {
    return null
  }
}

// Додай змінну для поточної команди десь біля інших ref
const currentTeam = ref('fs') // або 'alpha', залежно від того, що хочеш бачити за замовчуванням

const fetchLeads = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/admin/leads`, {
      params: { team: currentTeam.value }, // 🔥 Ось ключовий момент!
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
const SERVER_URL = 'https://obsidian-b.xyz'

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

  // Автоматично завантажуємо дані для вкладки Метрики
  if (tabName === 'metrics') {
    if (leadsByDayData.value.length === 0) {
      fetchLeadsByDay(7)
    }
    if (invitesByDayData.value.length === 0) {
      fetchInvitesByDay(7)
    }
  }
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

// ==================== МЕТРИКИ ====================
import VueApexCharts from 'vue3-apexcharts'

const metricsPeriod = ref(7) // 7, 14 або 30 днів

// Демо-дані для графіків (поки немає реальних даних по датах)
const invitesByDay = ref([
  { date: '2026-06-23', count: 87 },
  { date: '2026-06-24', count: 124 },
  { date: '2026-06-25', count: 98 },
  { date: '2026-06-26', count: 156 },
  { date: '2026-06-27', count: 132 },
  { date: '2026-06-28', count: 189 },
  { date: '2026-06-29', count: 143 }
])

const leadsByDay = ref([
  { date: '2026-06-23', count: 12 },
  { date: '2026-06-24', count: 19 },
  { date: '2026-06-25', count: 14 },
  { date: '2026-06-26', count: 27 },
  { date: '2026-06-27', count: 21 },
  { date: '2026-06-28', count: 31 },
  { date: '2026-06-29', count: 24 }
])

const topKeysByLeads = computed(() => {
  const stats = {}

  leadsAnalytics.value.forEach(lead => {
    const key = lead.woman_id || 'unknown'
    if (!stats[key]) {
      stats[key] = 0
    }
    stats[key]++
  })

  return Object.entries(stats)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// Опції для ApexCharts
const invitesChartOptions = computed(() => ({
  chart: { type: 'bar', height: 350, toolbar: { show: false } },
  xaxis: { categories: invitesByDay.value.map(d => d.date) },
  colors: ['#f59e0b'],
  plotOptions: { bar: { borderRadius: 4 } }
}))

const leadsChartOptions = computed(() => ({
  chart: { type: 'bar', height: 350, toolbar: { show: false } },
  xaxis: { categories: leadsByDay.value.map(d => d.date) },
  colors: ['#22c55e'],
  plotOptions: { bar: { borderRadius: 4 } }
}))

const topKeysChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 420,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      dataLabels: { position: 'center' }
    }
  },
  dataLabels: {
    enabled: true,
    style: { colors: ['#fff'] },
    formatter: (val) => val
  },
  xaxis: {
    categories: topKeysByLeads.value.map(item => item.key),
    labels: { style: { colors: '#94a3b8' } }
  },
  yaxis: {
    labels: { style: { colors: '#cbd5e1' } }
  },
  colors: ['#22c55e'],
  grid: { borderColor: '#334155' },
  tooltip: {
    theme: 'dark'
  }
}))

// ==================== ЛІДИ ЗА ДНЯМИ ====================
const leadsByDayData = ref([])
const leadsByDayLoading = ref(false)
const leadsByDayPeriod = ref(7)

const leadsByDayChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 340,
    toolbar: { show: false },
    animations: { enabled: true }
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '60%'
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: leadsByDayData.value.map(item => item.date),
    labels: { style: { colors: '#94a3b8', fontSize: '12px' } }
  },
  yaxis: {
    labels: { style: { colors: '#94a3b8' } }
  },
  colors: ['#22c55e'],
  grid: {
    borderColor: '#334155',
    strokeDashArray: 2
  },
  tooltip: { theme: 'dark' }
}))

const fetchLeadsByDay = async (days = 7) => {
  leadsByDayPeriod.value = days
  leadsByDayLoading.value = true

  try {
    const response = await axios.get(`${SERVER_URL}/admin/metrics/leads-by-day`, {
      params: { days },
      headers: { 'admin-token': authStore.token }
    })

    if (response.data.status === 'success') {
      leadsByDayData.value = response.data.data
    }
  } catch (e) {
    console.error("Помилка завантаження лідів за днями:", e)
    leadsByDayData.value = []
  } finally {
    leadsByDayLoading.value = false
  }
}

// ==================== ІНВАЙТИ ЗА ДНЯМИ ====================
const invitesByDayData = ref([])
const invitesByDayLoading = ref(false)
const invitesByDayPeriod = ref(7)

const invitesByDayChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 340,
    toolbar: { show: false },
    animations: { enabled: true }
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '60%'
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: invitesByDayData.value.map(item => item.date),
    labels: { style: { colors: '#94a3b8', fontSize: '12px' } }
  },
  yaxis: {
    labels: { style: { colors: '#94a3b8' } }
  },
  colors: ['#f59e0b'], // помаранчевий колір для інвайтів
  grid: {
    borderColor: '#334155',
    strokeDashArray: 2
  },
  tooltip: { theme: 'dark' }
}))

const fetchInvitesByDay = async (days = 7) => {
  invitesByDayPeriod.value = days
  invitesByDayLoading.value = true

  try {
    const response = await axios.get(`${SERVER_URL}/admin/metrics/invites-by-day`, {
      params: { days },
      headers: { 'admin-token': authStore.token }
    })

    if (response.data.status === 'success') {
      invitesByDayData.value = response.data.data
    }
  } catch (e) {
    console.error("Помилка завантаження інвайтів за днями:", e)
    invitesByDayData.value = []
  } finally {
    invitesByDayLoading.value = false
  }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: #0f172a; /* Темний фон */
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #e2e8f0;
}

.sidebar {
  width: 250px;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 22px 20px;
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  border-bottom: 1px solid #334155;
}

.nav-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 15px;
  cursor: pointer;
  color: #94a3b8;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn:hover {
  background: #334155;
  color: #f1f5f9;
}

.nav-btn.active {
  background: #334155;
  color: #22c55e; /* Зелений акцент */
  font-weight: 600;
}

.logout-btn {
  padding: 14px;
  background: #450a0a;
  color: #f87171;
  border: none;
  border-top: 1px solid #334155;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #7f1d1d;
}

/* Контент */
.content-area {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  background: #0f172a;
}

h2 {
  margin-top: 0;
  color: #f1f5f9;
  font-size: 26px;
  font-weight: 600;
}

/* Таблиці */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.admin-table th {
  background: #334155;
  font-weight: 600;
  color: #cbd5e1;
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
  vertical-align: middle;
}

.admin-table tr:hover {
  background: #334155;
}

.key-cell {
  font-family: monospace;
  color: #22c55e;
  font-weight: 600;
  cursor: pointer;
}

.key-cell:hover {
  text-decoration: underline;
}

/* Бейджи */
.badge {
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.badge.success {
  background: #166534;
  color: #4ade80;
}

.badge.danger {
  background: #7f1d1d;
  color: #f87171;
}

.badge.offline {
  background: #475569;
  color: #94a3b8;
}

/* Аватарки в таблиці Лідів */
.w-12.h-12 {
  width: 48px;
  height: 48px;
}

.rounded-full {
  border-radius: 9999px;
}

.overflow-hidden {
  overflow: hidden;
}

.object-cover {
  object-fit: cover;
}

/* Hover ефекти для аватарок */
div[class*="w-12 h-12"] {
  transition: all 0.2s ease;
}

div[class*="w-12 h-12"]:hover {
  transform: scale(1.08);
}

/* ==========================================
   МОДАЛЬНЕ ВІКНО ДЛЯ JSON
   ========================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1e293b;
  width: 900px;
  max-width: 95vw;
  max-height: 85vh;
  border-radius: 16px;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.4);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #334155;
  border-bottom: 1px solid #475569;
}

.modal-title {
  margin: 0;
  color: #f1f5f9;
  font-size: 17px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0 8px;
}

.close-btn:hover {
  color: #f87171;
}

.json-viewer {
  padding: 24px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  background: #0f172a;
  color: #a3e635;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
