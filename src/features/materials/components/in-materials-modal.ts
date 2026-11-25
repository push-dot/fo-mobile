import { useNavigation } from 'expo-router'

type State = { index: number; routes: { name: string }[] }

export const inMaterialsModal = (state: State) => state.routes.some((r, i) => i < state.index && r.name === 'materials/index')

export const useInMaterialsModal = () => inMaterialsModal(useNavigation().getState() as State)
