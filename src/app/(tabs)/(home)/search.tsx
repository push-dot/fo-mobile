import { useLocalSearchParams } from 'expo-router'
import { SearchScreen, isSearchTab } from '../../../features/search/SearchScreen'

/** `/search?tab=people` lets 허브 and 소셜 open the same screen on their tab. */
export default function Search() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  return <SearchScreen initialTab={isSearchTab(tab) ? tab : 'postings'} />
}
