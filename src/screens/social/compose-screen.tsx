import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { POST_CATEGORIES, type PostCategory } from '@push/api-client'
import { BODY_LABEL, MAX_IMAGES, POST_IMAGE_OPTIONS, TITLE_HINT, TITLE_LABEL, TITLE_MAX, acceptedPostImages, categoryLabel, toSocialImage, useCreatePost, type SocialImage } from '@/features/social'
import { Button, Glass, GlassButton, Icon, Menu, Text } from '@/shared/components'
import { pickImage } from '@/shared/infrastructure'
import { fontFor, useColors } from '@/theme'

const ComposeScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const [category, setCategory] = useState<PostCategory | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<SocialImage[]>([])
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null)
  const bodyRef = useRef<ComponentRef<typeof TextInput>>(null)
  const submit = useCreatePost()
  const ready = !!category && title.trim().length > 0 && body.trim().length > 0 && !submit.isPending

  const pick = async () => {
    const res = await pickImage({ ...POST_IMAGE_OPTIONS, selectionLimit: MAX_IMAGES - images.length })
    if (res.canceled) return
    const ok = acceptedPostImages(res.assets.map(toSocialImage))
    if (ok.length < res.assets.length) Alert.alert('올릴 수 없는 사진이 있어요', 'JPG, PNG, WEBP, HEIC 사진만 장당 10MB까지 올릴 수 있어요.')
    setImages((prev) => [...prev, ...ok].slice(0, MAX_IMAGES))
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
        <Menu
          accessibilityLabel={`카테고리, ${category ? categoryLabel(category) : '고르지 않음'}`}
          actions={POST_CATEGORIES.flatMap((x) =>
            x.key ? [{ key: x.key, label: x.label, selected: x.key === category, onPress: () => setCategory(x.key) }] : [],
          )}
        >
          <View style={{ minHeight: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text v="b2" color="t3">
              카테고리
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text v="b1" weight="700" color={category ? 'acText' : 't4'}>
                {category ? categoryLabel(category) : '골라 주세요'}
              </Text>
              <Icon name="down" size={16} color={category ? 'acText' : 't4'} />
            </View>
          </View>
        </Menu>
        <View style={{ gap: 6 }}>
          <Pressable accessible={false} onPress={() => titleRef.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Text v="c1" weight="700" color="t2">
              {TITLE_LABEL}
            </Text>
            <Text v="c2" color="t3">
              {TITLE_HINT}
            </Text>
          </Pressable>
          <TextInput
            ref={titleRef}
            testID="compose-title"
            value={title}
            onChangeText={setTitle}
            maxLength={TITLE_MAX}
            accessibilityLabel={TITLE_LABEL}
            placeholder="제목을 입력해 주세요"
            placeholderTextColor={c.t4}
            style={[{ fontSize: 22, letterSpacing: -0.66, color: c.t1, paddingTop: 4, paddingBottom: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.line }, fontFor('800')]}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Pressable accessible={false} onPress={() => bodyRef.current?.focus()} style={{ paddingHorizontal: 4 }}>
            <Text v="c1" weight="700" color="t2">
              {BODY_LABEL}
            </Text>
          </Pressable>
          <TextInput
            ref={bodyRef}
            testID="compose-body"
            value={body}
            onChangeText={setBody}
            maxLength={5000}
            multiline
            accessibilityLabel={BODY_LABEL}
            placeholder="나누고 싶은 이야기를 적어 주세요"
            placeholderTextColor={c.t4}
            style={[{ fontSize: 16, lineHeight: 26, color: c.t2, padding: 4, minHeight: 200, textAlignVertical: 'top' }, fontFor('400')]}
          />
        </View>
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
    </KeyboardAvoidingView>
  )
}

export default ComposeScreen
