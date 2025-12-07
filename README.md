## 인공지능앱개발 조별과제

## Node.js 다운로드
https://nodejs.org/ko/download/
접속 후 20.xx.xx 버전 선택 후 다운로드

## npm 다운로드
터미널창에서 npm install npx -g

## 📌 expo 다운로드 (굳이 안해도 됨)
* npm install expo

## ✅ 버전 오류 해결 방법
### 1번
* npm uninstall @expo/webpack-config
### 2번
* @expo/webpack-config@19.0.3
* npm install @expo/webpack-config@19.0.3 --save-dev
### ⚠️ 절대로 하면 안 되는 것
* npm install --force
* npm install --legacy-peer-deps

## 📌 expo fix
* npm audit fix
* npm audit fix --force

## 📌 라이브러리 설치
* npx expo install @expo/webpack-config@^18.0.1
* npm install expo@~48.0.0 react@18.2.0 react-native@0.71.8 react-dom@18.2.0 react-native-web@~0.18.10
* npm install @react-navigation/native@6.1.6 @react-navigation/stack@^6.3.16 @react-navigation/bottom-tabs@6.5.7 react-native-gesture-handler@~2.9.0 react-native-safe-area-context@4.5.0 react-native-screens@~3.20.0
* npm install firebase@^9.23.0 @react-native-async-storage/async-storage@1.17.11
* npm install react-native-chart-kit@^6.12.0 react-native-svg@13.4.0 styled-components@^5.3.11
* npx expo install expo-status-bar@~1.4.4 expo-font@~11.1.1 expo-linear-gradient@~12.1.2 @expo/vector-icons
* npm install --save-dev @babel/core@^7.20.0

## 📌 Expo 실행
* npx expo start

## 🔧 설치/주의사항
* react-native-chart-kit와 react-native-svg, @react-native-async-storage/async-storage가 필요합니다. (이전 package.json에 포함)
* 사전(WORD_DICT)은 utils/wordDictionary.js에서 조절하세요. 프로젝트 초기에는 적은 수의 키워드만 넣고 테스트 후 확장 권장.
* 감성 판단 문턱값(estimateSentimentFromWeighted)은 실사용 테스트 후 조정하세요.
* OpenAI API 등 외부 서비스를 연동할 경우 서버사이드에서 API 키를 안전하게 관리하세요. 직접 클라이언트에 키를 넣지 마세요.

## 발표
ppt에 깃허브 링크 추가, 오픈AI 기능, 로그인 기능 추가, 서버 여는 방법 찾아서 시도하기
