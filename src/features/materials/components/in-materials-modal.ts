import { useNavigation } from 'expo-router'

type State = { index: number; routes: { name: string }[] }

/** A material page pushed from the list sits inside the 자료 modal; one opened from a chat source is a plain full page. */
export const inMaterialsModal = (state: State) => state.routes.some((r, i) => i < state.index && r.name === 'materials/index')

export const useInMaterialsModal = () => inMaterialsModal(useNavigation().getState() as State)
