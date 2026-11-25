import * as Crypto from 'expo-crypto'
import { Directory, File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export const shareBytes = async (name: string, bytes: Uint8Array, mimeType?: string) => {
  const dir = new Directory(Paths.cache, 'share', Crypto.randomUUID())
  try {
    dir.create({ intermediates: true })
    const file = new File(dir, name)
    file.write(bytes)
    await Sharing.shareAsync(file.uri, { dialogTitle: name, mimeType })
  } finally {
    if (dir.exists) dir.delete()
  }
}
