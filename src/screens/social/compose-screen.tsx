import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useRef, useState, type ComponentRef } from 'react'
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { POST_CATEGORIES, type PostCategory } from '@push/api-client'
import { BODY_LABEL, MAX_IMAGES, POST_IMAGE_OPTIONS, TITLE_HINT, TITLE_LABEL, TITLE_MAX, acceptedPostImages, categoryLabel, toSocialImage, useCreatePost, type SocialImage } from '@/features/social'
import { Button, GlassButton, Icon, Menu, Text } from '@/shared/components'
import { inputReset, iosLineBox } from '@/shared/components/text-field-metrics'
import { pickImage } from '@/shared/infrastructure'
import { fontFor, onAccent, spacing, useColors } from '@/theme'

const BODY_HEIGHT = 200 + spacing[1] * 2

const ComposeScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { fontScale } = useWindowDimensions()
  const [category, setCategory] = useState<PostCategory | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<SocialImage[]>([])
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null)
  const bodyRef = useRef<ComponentRef<typeof TextInput>>(null)
  const submit = useCreatePost()
  const ready = !!category && title.trim().length > 0 && body.trim().length > 0 && !submit.isPending

  const pick = async () => {
    Keyboard.dismiss()
    const res = await pickImage({ ...POST_IMAGE_OPTIONS, selectionLimit: MAX_IMAGES - images.length })
    if (res.canceled) return
    const ok = acceptedPostImages(res.assets.map(toSocialImage))
    if (ok.length < res.assets.length) Alert.alert('올릴 수 없는 사진이 있어요', 'JPG, PNG, WEBP, HEIC 사진만 장당 10MB까지 올릴 수 있어요.')
    setImages((prev) => [...prev, ...ok].slice(0, MAX_IMAGES))
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <View style={styles.header(insets.top)}>
        <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
        <Text v="h3" accessibilityRole="header" style={styles.title}>
          새 글
        </Text>
        <Button label="게시" size="pill" style={styles.submit} disabled={!ready} onPress={() => submit.mutate({ category: category!, title, body, images })} />
      </View>
      <ScrollView contentContainerStyle={styles.content(insets.bottom)} keyboardShouldPersistTaps="handled">
        <Menu
          stretch
          accessibilityLabel={`카테고리, ${category ? categoryLabel(category) : '고르지 않음'}`}
          actions={POST_CATEGORIES.flatMap((x) =>
            x.key ? [{ key: x.key, label: x.label, selected: x.key === category, onPress: () => setCategory(x.key) }] : [],
          )}
        >
          <View style={styles.category}>
            <Text v="b2" color="t3">
              카테고리
            </Text>
            <View style={styles.categoryValue}>
              <Text v="b1" weight="700" color={category ? 't1' : 't4'}>
                {category ? categoryLabel(category) : '골라 주세요'}
              </Text>
              <Icon name="down" size={16} color={category ? 't1' : 't4'} />
            </View>
          </View>
        </Menu>
        <View style={styles.field}>
          <Pressable accessible={false} onPress={() => titleRef.current?.focus()} style={styles.titleLabel}>
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
            style={styles.titleInput}
          />
        </View>
        <View style={styles.field}>
          <Pressable accessible={false} onPress={() => bodyRef.current?.focus()} style={styles.bodyLabel}>
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
            style={styles.bodyInput(fontScale)}
          />
        </View>
        <View style={styles.images}>
          {images.map((a, i) => (
            <View key={a.uri}>
              <Image source={a.uri} contentFit="cover" style={styles.image} accessibilityIgnoresInvertColors />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`사진 ${i + 1} 빼기`}
                onPress={() => setImages((prev) => prev.filter((x) => x.uri !== a.uri))}
                hitSlop={11}
                style={styles.removeImage}
              >
                <Icon name="x" size={12} color={onAccent} />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`사진 추가, ${images.length}/${MAX_IMAGES}`} onPress={pick}>
              <View style={styles.addImage}>
                <Icon name="plus" size={22} color="t1" />
                <Text v="c2" weight="700" color="t1">
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

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: (top: number) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[4] : top + theme.spacing[4],
    paddingBottom: theme.spacing[4],
  }),
  title: { flex: 1, textAlign: 'center' },
  submit: { flexGrow: 0 },
  content: (bottom: number) => ({ paddingHorizontal: theme.spacing[5], gap: theme.spacing[4], paddingBottom: bottom + theme.spacing[4] }),
  category: { minHeight: 56, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.md, backgroundColor: theme.colors.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryValue: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
  field: { gap: 6 },
  titleLabel: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: theme.spacing[1] },
  titleInput: {
    ...inputReset,
    fontSize: 22,
    letterSpacing: -0.66,
    color: theme.colors.t1,
    paddingTop: theme.spacing[1],
    paddingBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    ...fontFor('800'),
  },
  bodyLabel: { paddingHorizontal: theme.spacing[1] },
  bodyInput: (fontScale: number) => ({
    ...inputReset,
    fontSize: theme.type.b1.fontSize,
    lineHeight: 26,
    color: theme.colors.t2,
    padding: theme.spacing[1],
    ...iosLineBox(26, theme.type.b1.fontSize, fontScale),
    paddingTop: theme.spacing[1],
    minHeight: BODY_HEIGHT,
    textAlignVertical: 'top',
    ...fontFor('400'),
  }),
  images: { flexDirection: 'row', gap: theme.spacing[2], alignItems: 'center' },
  image: { width: 80, height: 80, borderRadius: 14, backgroundColor: theme.colors.fill2 },
  removeImage: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.scrim, alignItems: 'center', justifyContent: 'center' },
  addImage: { width: 80, height: 80, borderRadius: theme.radius.md, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center', gap: 2 },
}))

export default ComposeScreen
