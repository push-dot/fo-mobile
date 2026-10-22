import { useLocalSearchParams } from 'expo-router'
import { isSearchTab } from '@/features/search'
import SearchScreen from '@/screens/search/search-screen'

const Search = () => {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  return <SearchScreen initialTab={isSearchTab(tab) ? tab : 'postings'} />
}

export default Search
