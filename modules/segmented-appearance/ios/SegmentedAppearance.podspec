Pod::Spec.new do |s|
  s.name           = 'SegmentedAppearance'
  s.version        = '1.0.0'
  s.summary        = 'Sets the title font of every UISegmentedControl'
  s.description    = 'The SwiftUI segmented Picker ignores a font modifier, so the weight goes through UIAppearance.'
  s.author         = 'Push'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
