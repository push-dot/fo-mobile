import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useRef, useState, type ComponentRef } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { POST_CATEGORIES, type PostCategory } from '@push/api-client'
import { BODY_LABEL, MAX_IMAGES, POST_IMAGE_OPTIONS, TITLE_HINT, TITLE_LABEL, TITLE_MAX, acceptedPostImages, categoryLabel, toSocialImage, useCreatePost, type SocialImage } from '@/features/social'
import { Button, GlassButton, Icon, Menu, Text } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { pickImage } from '@/shared/infrastructure'
import { fontFor, onAccent, radius, spacing, type, useColors } from '@/theme'

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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: ios ? spacing[4] : insets.top + spacing[4], paddingBottom: spacing[4] }}>
        <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          새 글
        </Text>
        <Button label="게시" size="pill" style={{ flexGrow: 0 }} disabled={!ready} onPress={() => submit.mutate({ category: category!, title, body, images })} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], gap: spacing[4], paddingBottom: insets.bottom + spacing[4] }} keyboardShouldPersistTaps="handled">
        <Menu
          stretch
          accessibilityLabel={`카테고리, ${category ? categoryLabel(category) : '고르지 않음'}`}
          actions={POST_CATEGORIES.flatMap((x) =>
            x.key ? [{ key: x.key, label: x.label, selected: x.key === category, onPress: () => setCategory(x.key) }] : [],
          )}
        >
          <View style={{ minHeight: 56, paddingHorizontal: spacing[4], borderRadius: radius.md, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text v="b2" color="t3">
              카테고리
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
              <Text v="b1" weight="700" color={category ? 'acText' : 't4'}>
                {category ? categoryLabel(category) : '골라 주세요'}
              </Text>
              <Icon name="down" size={16} color={category ? 'acText' : 't4'} />
            </View>
          </View>
        </Menu>
        <View style={{ gap: 6 }}>
          <Pressable accessible={false} onPress={() => titleRef.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing[1] }}>
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
            style={[{ ...inputReset, fontSize: 22, letterSpacing: -0.66, color: c.t1, paddingTop: spacing[1], paddingBottom: spacing[2], paddingHorizontal: spacing[1], borderBottomWidth: 1, borderBottomColor: c.line }, fontFor('800')]}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Pressable accessible={false} onPress={() => bodyRef.current?.focus()} style={{ paddingHorizontal: spacing[1] }}>
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
            style={[{ ...inputReset, fontSize: type.b1.fontSize, lineHeight: 26, color: c.t2, padding: spacing[1], minHeight: 200, textAlignVertical: 'top' }, fontFor('400')]}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
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
                <Icon name="x" size={12} color={onAccent} />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`사진 추가, ${images.length}/${MAX_IMAGES}`} onPress={pick}>
              <View style={{ width: 80, height: 80, borderRadius: radius.md, backgroundColor: c.bg2, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Icon name="plus" size={22} color="acText" />
                <Text v="c2" weight="700" color="acText">
                  {images.length}/{MAX_IMAGES}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ComposeScreen
