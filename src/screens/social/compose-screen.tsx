import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { POST_CATEGORIES, type PostCategory } from '@push/api-client'
import { MAX_IMAGES, categoryLabel, pickPostImages, useCreatePost, type SocialImage } from '@/features/social'
import { BottomSheet, Button, Glass, GlassButton, Icon, SettingsGroup, SettingsRow, Text } from '@/shared/components'
import { fontFor, useColors } from '@/theme'

const ComposeScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const [category, setCategory] = useState<PostCategory | null>(null)
  const [picking, setPicking] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<SocialImage[]>([])
  const submit = useCreatePost()
  const ready = !!category && title.trim().length > 0 && body.trim().length > 0 && !submit.isPending

  const pick = async () => {
    const picked = await pickPostImages(images.length)
    if (!picked) return
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES))
  }

  const field = (children: ReactNode, style: object) =>
    ios ? <Glass style={[{ borderRadius: 16 }, style]}>{children}</Glass> : <View style={[{ borderRadius: 16, backgroundColor: c.fill }, style]}>{children}</View>

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: ios ? 14 : insets.top + 14, paddingBottom: 14 }}>
        <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          새 글
        </Text>
        <Button label="게시" size="sm" disabled={!ready} onPress={() => submit.mutate({ category: category!, title, body, images })} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel={`카테고리, ${category ? categoryLabel(category) : '고르지 않음'}`} onPress={() => setPicking(true)}>
          {field(
            <>
              <Text v="b2" color="t3">
                카테고리
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text v="b1" weight="700" color={category ? 'acText' : 't4'}>
                  {category ? categoryLabel(category) : '골라 주세요'}
                </Text>
                <Icon name="down" size={16} color={category ? 'acText' : 't4'} />
              </View>
            </>,
            { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          )}
        </Pressable>
        <TextInput
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          accessibilityLabel="제목"
          placeholder="제목"
          placeholderTextColor={c.t4}
          style={[{ fontSize: 22, letterSpacing: -0.66, color: c.t1, paddingVertical: 6, paddingHorizontal: 4 }, fontFor('800')]}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          maxLength={5000}
          multiline
          accessibilityLabel="본문"
          placeholder="나누고 싶은 이야기를 적어 주세요"
          placeholderTextColor={c.t4}
          style={[{ fontSize: 16, lineHeight: 26, color: c.t2, paddingHorizontal: 4, minHeight: 220, textAlignVertical: 'top' }, fontFor('400')]}
        />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {images.map((a, i) => (
            <View key={a.uri}>
              <Image source={a.uri} contentFit="cover" style={{ width: 80, height: 80, borderRadius: 14, backgroundColor: c.fill2 }} accessibilityIgnoresInvertColors />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`사진 ${i + 1} 빼기`}
                onPress={() => setImages((prev) => prev.filter((x) => x.uri !== a.uri))}
                hitSlop={11}
                style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: c.scrim, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`사진 추가, ${images.length}/${MAX_IMAGES}`} onPress={pick}>
              {field(
                <>
                  <Icon name="plus" size={22} color="acText" />
                  <Text v="c2" weight="700" color="acText">
                    {images.length}/{MAX_IMAGES}
                  </Text>
                </>,
                { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', gap: 2 },
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <BottomSheet visible={picking} onClose={() => setPicking(false)} title="어떤 이야기인가요?">
        <SettingsGroup>
          {POST_CATEGORIES.filter((x) => x.key).map((x) => (
            <SettingsRow
              key={x.key}
              label={x.label}
              right={x.key === category ? <Icon name="check" size={20} color="acText" /> : <View />}
              onPress={() => {
                setCategory(x.key)
                setPicking(false)
              }}
            />
          ))}
        </SettingsGroup>
      </BottomSheet>
    </KeyboardAvoidingView>
  )
}

export default ComposeScreen
