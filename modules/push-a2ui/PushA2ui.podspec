Pod::Spec.new do |s|
  s.name           = 'PushA2ui'
  s.version        = '1.0.0'
  s.summary        = 'A2UI surface view for Push'
  s.description    = 'Wraps the official A2UI SwiftUI renderer in an Expo UI view'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  # A2UISwiftUI needs iOS 17.
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoUI'

  # Defined by react_native_pods.rb, which the app Podfile requires.
  spm_dependency(s,
    url: 'https://github.com/a2ui-project/a2ui.git',
    requirement: { kind: 'upToNextMinorVersion', minimumVersion: '0.11.0' },
    products: ['A2UISwiftCore', 'A2UISwiftUI', 'BasicCatalog', 'BasicCatalogSwiftUI']
  )

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  # At the module root (expo-module.config.json `podspecPath`) so the pod can bundle catalog/: CocoaPods ignores paths above the podspec.
  s.source_files = "ios/**/*.{h,m,mm,swift,hpp,cpp}"
  # The vendored Push catalog: PushCatalog.swift reads each Push component's schema from it.
  s.resource_bundles = { 'PushA2uiCatalog' => ['catalog/*.json'] }
end
