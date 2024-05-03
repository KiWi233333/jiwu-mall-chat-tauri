import { ProgressInfo } from 'electron-updater'

type UpdaterStatus = 'idle' | 'check-for-update' | 'update-available' | 'update-not-available' | 'update-error' | 'downloading' | 'update-downloaded'

const currentStatus = ref<UpdaterStatus>('idle')
const progress = ref<ProgressInfo>()
const readyToInstall = ref(false)
const alreadyInitialized = ref(false)

export default function useElectron() {
  const isServer = process.server || typeof window === 'undefined' || typeof window.require === 'undefined'
  const isElectron = !isServer && navigator.userAgent.toLowerCase().includes('electron')
  if (!isElectron || isServer) return { isElectron }

  // Initialize electron
  const electron = window.require('electron')

  // Listeners
  // ==============
  if (!alreadyInitialized.value) {
    alreadyInitialized.value = true
    electron.ipcRenderer.on('updater:statusChanged', (_event, args) => {
      currentStatus.value = args[0]
      progress.value = args[1]
      console.warn({ currentStatus: currentStatus.value })
    })
    electron.ipcRenderer.on('updater:readyToInstall', () => {
      readyToInstall.value = true
    })
  }

  async function checkForUpdate() {
    await electron.ipcRenderer.invoke('updater:check')
  }

  function quitAndInstall() {
    if (!readyToInstall.value) return
    electron.ipcRenderer.invoke('updater:quitAndInstall')
  }

  return { isElectron, currentStatus, progress, readyToInstall, checkForUpdate, quitAndInstall }
}
