import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { ChannelProfile } from '../schemas/index.js'

/** Standard-Verzeichnis der Channel Profiles (content-factory/channels). */
export const CHANNELS_DIR = fileURLToPath(new URL('../../channels/', import.meta.url))

/**
 * Lädt und validiert ein Channel Profile. Ein zweites Profil muss OHNE
 * Kerncode-Änderung ladbar sein (nur eine neue JSON-Datei) — DoD.
 */
export function loadChannelProfile(slug: string, channelsDir = CHANNELS_DIR): ChannelProfile {
  const path = join(channelsDir, slug, 'profile.json')
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  return ChannelProfile.parse(raw)
}
