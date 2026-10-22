import { api, deleteAccount, pickDocument, pickImage, signOut } from '../../../shared/infrastructure'
import { DOC_TYPES } from '../constants'

export const pickAvatarImage = () =>
  pickImage({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 })

export const uploadAvatarImage = async (file: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
  const form = new FormData()
  form.append('file', {
    uri: file.uri,
    name: file.fileName ?? 'avatar.jpg',
    type: file.mimeType ?? 'image/jpeg',
  } as unknown as Blob)
  return api.uploads.image(form)
}

export const pickResumeFile = () =>
  pickDocument({ type: DOC_TYPES, copyToCacheDirectory: true })

export const signOutSession = () => signOut()

export const deleteAccountSession = () => deleteAccount()
